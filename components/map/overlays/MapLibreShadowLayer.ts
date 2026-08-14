import { CustomLayerInterface, Map as MapLibre, MercatorCoordinate } from 'maplibre-gl';
import earcut from 'earcut';
import { ShadowConfig } from './ShadowConfig';

export class MapLibreShadowLayer implements CustomLayerInterface {
  public id = 'kyrgyzstan-ambient-shadow';
  public type = 'custom' as const;
  public renderingMode = '2d' as const;

  private map: MapLibre | null = null;
  private gl: WebGLRenderingContext | null = null;
  private geojsonUrl: string;

  // WebGL Ресурсы
  private polygonProgram: WebGLProgram | null = null;
  private blurProgram: WebGLProgram | null = null;
  private overlayProgram: WebGLProgram | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  private quadBuffer: WebGLBuffer | null = null;
  private fbo: WebGLFramebuffer | null = null;
  private fboTexture: WebGLTexture | null = null;

  // Состояние и Флаги
  private indexCount = 0;
  private indexType: number = 0; // gl.UNSIGNED_SHORT или gl.UNSIGNED_INT
  private fboWidth = 0;
  private fboHeight = 0;
  private isContextLost = false;
  private hasFatalError = false;

  constructor(geojsonUrl: string) {
    this.geojsonUrl = geojsonUrl;
  }
  
  public async onAdd(map: MapLibre, gl: WebGLRenderingContext) {
    this.map = map;
    this.gl = gl;
    this.isContextLost = false;
    this.hasFatalError = false;

    // Подписка на потерю контекста (Пункт 4)
    gl.canvas.addEventListener('webglcontextlost', this.handleContextLost, false);
    gl.canvas.addEventListener('webglcontextrestored', this.handleContextRestored, false);

    const geoDataLoaded = await this.fetchAndTriangulate();
    if (!geoDataLoaded) {
      this.hasFatalError = true;
      return;
    }

    if (!this.initShaders() || !this.initQuadBuffer()) {
      this.hasFatalError = true;
      return;
    }
    
    map.triggerRepaint();
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.isContextLost = true;
    console.warn('[MapLibreShadowLayer] WebGL context lost.');
  };

  private handleContextRestored = async () => {
    console.info('[MapLibreShadowLayer] WebGL context restored. Rebuilding resources...');
    if (this.map && this.gl) {
      await this.onAdd(this.map, this.gl);
    }
  };

  // Пункт 7: Безопасная загрузка и валидация
  private async fetchAndTriangulate(): Promise<boolean> {
    const gl = this.gl;
    if (!gl) return false;

    try {
      const res = await fetch(this.geojsonUrl);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      
      const geometry = data?.features?.[0]?.geometry;
      if (!geometry || !geometry.coordinates) {
        throw new Error('Invalid GeoJSON structure');
      }

      const coordinates = geometry.type === 'Polygon' 
        ? [geometry.coordinates] 
        : geometry.coordinates;

      const vertices: number[] = [];
      const indices: number[] = [];
      let offset = 0;

      for (const polygon of coordinates) {
        const flatCoords: number[] = [];
        const holeIndices: number[] = [];

        for (let i = 0; i < polygon.length; i++) {
          if (i > 0) holeIndices.push(flatCoords.length / 2);
          for (const [lng, lat] of polygon[i]) {
            const merc = MercatorCoordinate.fromLngLat({ lng, lat });
            flatCoords.push(merc.x, merc.y);
          }
        }

        const triangulated = earcut(flatCoords, holeIndices);
        for (const coord of flatCoords) vertices.push(coord);
        for (const idx of triangulated) indices.push(idx + offset);
        offset += flatCoords.length / 2;
      }

      this.indexCount = indices.length;

      // Пункт 5: Поддержка больших полигонов (OES_element_index_uint)
      const ext = gl.getExtension('OES_element_index_uint');
      const useUint32 = Boolean(ext) && this.indexCount > 65535;
      this.indexType = useUint32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
      const indexData = useUint32 ? new Uint32Array(indices) : new Uint16Array(indices);

      // Пункт 6: Проверка создания ресурсов
      this.vertexBuffer = gl.createBuffer();
      this.indexBuffer = gl.createBuffer();
      if (!this.vertexBuffer || !this.indexBuffer) throw new Error('Failed to create WebGL buffers');

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

      return true;
    } catch (e) {
      console.error('[MapLibreShadowLayer] Geometry load/parse error:', e);
      return false;
    }
  }

  // Пункт 1: Строгая проверка компиляции и линковки шейдеров
  private createProgram(vsSource: string, fsSource: string): WebGLProgram | null {
    const gl = this.gl;
    if (!gl) return null;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(`[Shader Error]: ${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;

    const prog = gl.createProgram();
    if (!prog) return null;
    
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(`[Program Link Error]: ${gl.getProgramInfoLog(prog)}`);
      gl.deleteProgram(prog);
      return null;
    }

    // Очистка памяти от шейдеров после линковки
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    return prog;
  }

  private initShaders(): boolean {
    const polyVs = `uniform mat4 u_matrix; attribute vec2 a_pos; void main() { gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0); }`;
    const polyFs = `precision mediump float; void main() { gl_FragColor = vec4(1.0); }`;
    this.polygonProgram = this.createProgram(polyVs, polyFs);

    const blurVs = `attribute vec2 a_pos; varying vec2 v_uv; void main() { v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`;
    const blurFs = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_blur;
      uniform vec3 u_color;
      uniform float u_opacity;
      varying vec2 v_uv;

      void main() {
        vec2 texel = u_blur / u_resolution;
        float alpha = 0.0;
        
        alpha += texture2D(u_texture, v_uv + vec2(-2.0, -2.0) * texel).r * 0.015625;
        alpha += texture2D(u_texture, v_uv + vec2(-1.0, -2.0) * texel).r * 0.0625;
        alpha += texture2D(u_texture, v_uv + vec2( 0.0, -2.0) * texel).r * 0.09375;
        alpha += texture2D(u_texture, v_uv + vec2( 1.0, -2.0) * texel).r * 0.0625;
        alpha += texture2D(u_texture, v_uv + vec2( 2.0, -2.0) * texel).r * 0.015625;
        
        alpha += texture2D(u_texture, v_uv + vec2(-2.0,  0.0) * texel).r * 0.09375;
        alpha += texture2D(u_texture, v_uv + vec2(-1.0,  0.0) * texel).r * 0.3125;
        alpha += texture2D(u_texture, v_uv + vec2( 0.0,  0.0) * texel).r * 0.625;
        alpha += texture2D(u_texture, v_uv + vec2( 1.0,  0.0) * texel).r * 0.3125;
        alpha += texture2D(u_texture, v_uv + vec2( 2.0,  0.0) * texel).r * 0.09375;

        alpha = clamp(alpha * 0.8, 0.0, 1.0);
        gl_FragColor = vec4(u_color, alpha * u_opacity);
      }
    `;
    this.blurProgram = this.createProgram(blurVs, blurFs);
    const overlayVs = `
    attribute vec2 a_pos;
    void main() {
        gl_Position = vec4(a_pos, 0.0, 1.0);
    }
    `;

    const overlayFs = `
    precision mediump float;

    uniform vec4 u_color;

    void main() {
        gl_FragColor = u_color;
    }
    `;

    this.overlayProgram = this.createProgram(
        overlayVs,
        overlayFs
    );

    return Boolean(
        this.polygonProgram &&
        this.overlayProgram &&
        this.blurProgram
    );
  }

  private initQuadBuffer(): boolean {
    const gl = this.gl;
    if (!gl) return false;
    this.quadBuffer = gl.createBuffer();
    if (!this.quadBuffer) return false;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    return true;
  }

  private resizeFBO(): boolean {
    const gl = this.gl;
    if (!gl) return false;

    const scale = ShadowConfig.getResolutionScale();
    const targetWidth = Math.floor(gl.canvas.width * scale);
    const targetHeight = Math.floor(gl.canvas.height * scale);

    if (this.fboWidth === targetWidth && this.fboHeight === targetHeight && this.fbo) return true;

    this.fboWidth = targetWidth;
    this.fboHeight = targetHeight;

    if (this.fboTexture) gl.deleteTexture(this.fboTexture);
    if (this.fbo) gl.deleteFramebuffer(this.fbo);

    this.fboTexture = gl.createTexture();
    this.fbo = gl.createFramebuffer();
    
    if (!this.fboTexture || !this.fbo) {
      console.error('[MapLibreShadowLayer] Failed to create FBO resources');
      return false;
    }

    gl.bindTexture(gl.TEXTURE_2D, this.fboTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, targetWidth, targetHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fboTexture, 0);

    // Пункт 2: Проверка Framebuffer
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error(`[MapLibreShadowLayer] Incomplete Framebuffer: ${status}`);
      this.hasFatalError = true;
      return false;
    }

    return true;
  }

  public render(gl: WebGLRenderingContext, args: any) {
    if (!ShadowConfig.enabled || this.isContextLost || this.hasFatalError) return;
    if (!this.polygonProgram || !this.blurProgram || this.indexCount === 0) return;
    if (!this.resizeFBO()) return;

    // Пункт 3: Полное сохранение состояния WebGL
    const originalFBO = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    const originalViewport = gl.getParameter(gl.VIEWPORT);
    const originalProgram = gl.getParameter(gl.CURRENT_PROGRAM);
    const originalActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
    const originalTextureBinding = gl.getParameter(gl.TEXTURE_BINDING_2D);
    const originalArrayBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
    const originalElementArrayBuffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
    
    const originalBlend = gl.isEnabled(gl.BLEND);
    const originalDepthTest = gl.isEnabled(gl.DEPTH_TEST);
    const originalStencilTest = gl.isEnabled(gl.STENCIL_TEST);
    const originalColorMask = gl.getParameter(gl.COLOR_WRITEMASK);
    
    const originalBlendSrcRGB = gl.getParameter(gl.BLEND_SRC_RGB);
    const originalBlendDstRGB = gl.getParameter(gl.BLEND_DST_RGB);
    const originalBlendSrcAlpha = gl.getParameter(gl.BLEND_SRC_ALPHA);
    const originalBlendDstAlpha = gl.getParameter(gl.BLEND_DST_ALPHA);
    const originalStencilFunc = gl.getParameter(gl.STENCIL_FUNC);
    const originalStencilRef = gl.getParameter(gl.STENCIL_REF);
    const originalStencilValueMask = gl.getParameter(gl.STENCIL_VALUE_MASK);
    
    // --- НАЧАЛО РЕНДЕР-ПАССОВ ---
    
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    
    // Проход 1: Полигон -> FBO
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, this.fboWidth, this.fboHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.polygonProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    
    const posLoc = gl.getAttribLocation(this.polygonProgram, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    
    const matrixLoc = gl.getUniformLocation(this.polygonProgram, 'u_matrix');
    gl.uniformMatrix4fv(
        matrixLoc,
        false,
        args.defaultProjectionData.mainMatrix
    );
    gl.drawElements(gl.TRIANGLES, this.indexCount, this.indexType, 0);

    // Проход 2: Маска (Stencil)
    gl.bindFramebuffer(gl.FRAMEBUFFER, originalFBO);
    gl.viewport(originalViewport[0], originalViewport[1], originalViewport[2], originalViewport[3]);
    
    gl.enable(gl.STENCIL_TEST);
    gl.stencilMask(0xFF);
    gl.clearStencil(0);
    gl.clear(gl.STENCIL_BUFFER_BIT);
    
    gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    gl.colorMask(false, false, false, false);
    
    gl.drawElements(gl.TRIANGLES, this.indexCount, this.indexType, 0);

    // Проход 3: Размытие с композитингом
    gl.colorMask(true, true, true, true);
    gl.stencilFunc(gl.NOTEQUAL, 1, 0xFF);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    // ---------- Gray Overlay ----------
    gl.useProgram(this.overlayProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);

    const overlayPosLoc = gl.getAttribLocation(
        this.overlayProgram!,
        "a_pos"
    );

    gl.enableVertexAttribArray(overlayPosLoc);

    gl.vertexAttribPointer(
        overlayPosLoc,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    const overlayColorLoc = gl.getUniformLocation(
        this.overlayProgram!,
        "u_color"
    );

    gl.uniform4f(
        overlayColorLoc,
        0.90,   // R
        0.91,   // G
        0.92,   // B
        1.0    // прозрачность
    );

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // ---------- End Gray Overlay ----------
    gl.clear(gl.STENCIL_BUFFER_BIT);

    gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    gl.colorMask(false, false, false, false);

    gl.useProgram(this.polygonProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(
        matrixLoc,
        false,
        args.defaultProjectionData.mainMatrix
    );

    gl.drawElements(gl.TRIANGLES, this.indexCount, this.indexType, 0);

    gl.colorMask(true, true, true, true);

    gl.stencilFunc(gl.NOTEQUAL, 1, 0xFF);
    gl.useProgram(this.blurProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    
    const quadPosLoc = gl.getAttribLocation(this.blurProgram, 'a_pos');
    gl.enableVertexAttribArray(quadPosLoc);
    gl.vertexAttribPointer(quadPosLoc, 2, gl.FLOAT, false, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fboTexture);
    
    gl.uniform1i(gl.getUniformLocation(this.blurProgram, 'u_texture'), 0);
    gl.uniform2f(gl.getUniformLocation(this.blurProgram, 'u_resolution'), this.fboWidth, this.fboHeight);
    gl.uniform1f(gl.getUniformLocation(this.blurProgram, 'u_blur'), ShadowConfig.blurRadius * ShadowConfig.getResolutionScale());
    gl.uniform3fv(gl.getUniformLocation(this.blurProgram, 'u_color'), ShadowConfig.color);
    gl.uniform1f(gl.getUniformLocation(this.blurProgram, 'u_opacity'), ShadowConfig.opacity);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // --- ВОССТАНОВЛЕНИЕ СОСТОЯНИЯ (Пункт 3) ---
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, originalFBO);
    gl.useProgram(originalProgram);
    gl.activeTexture(originalActiveTexture);
    gl.bindTexture(gl.TEXTURE_2D, originalTextureBinding);
    gl.bindBuffer(gl.ARRAY_BUFFER, originalArrayBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, originalElementArrayBuffer);
    
    if (originalBlend) gl.enable(gl.BLEND); else gl.disable(gl.BLEND);
    if (originalDepthTest) gl.enable(gl.DEPTH_TEST); else gl.disable(gl.DEPTH_TEST);
    if (originalStencilTest) gl.enable(gl.STENCIL_TEST); else gl.disable(gl.STENCIL_TEST);
    
    gl.colorMask(originalColorMask[0], originalColorMask[1], originalColorMask[2], originalColorMask[3]);
    gl.blendFuncSeparate(originalBlendSrcRGB, originalBlendDstRGB, originalBlendSrcAlpha, originalBlendDstAlpha);
    gl.stencilFunc(originalStencilFunc, originalStencilRef, originalStencilValueMask);
  }

  public onRemove(map: MapLibre, gl: WebGLRenderingContext) {
    gl.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    gl.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);

    if (this.polygonProgram) gl.deleteProgram(this.polygonProgram);
    if (this.blurProgram) gl.deleteProgram(this.blurProgram);
    if (this.vertexBuffer) gl.deleteBuffer(this.vertexBuffer);
    if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);
    if (this.quadBuffer) gl.deleteBuffer(this.quadBuffer);
    if (this.fboTexture) gl.deleteTexture(this.fboTexture);
    if (this.fbo) gl.deleteFramebuffer(this.fbo);
    
    this.map = null;
    this.gl = null;
  }
}