import maplibregl from "maplibre-gl";
import earcut, { flatten } from "earcut";

export class KyrgyzstanMaskLayer implements maplibregl.CustomLayerInterface {
  public id = "kg-clipping-mask";
  public type: "custom" = "custom";
  public renderingMode: "2d" = "2d";

  private program: WebGLProgram | null = null;
  private vbo: WebGLBuffer | null = null;
  private ibo: WebGLBuffer | null = null;
  private indexCount = 0;
  private aPosLocation = -1;
  private uMatrixLocation: WebGLUniformLocation | null = null;
  private useUint32 = false;

  async onAdd(map: maplibregl.Map, gl: WebGLRenderingContext | WebGL2RenderingContext) {
    try {
      // 1. Загрузка GeoJSON маски (инвертированный полигон)
      const response = await fetch("/geojson/kyrgyzstan-mask.geojson");
      if (!response.ok) throw new Error("Failed to load mask geojson");
      const data = await response.json();
      
      const geometry = data.features[0].geometry;
      const coordinates = geometry.coordinates;

      // 2. Плоская развертка и триангуляция через Earcut
      const flattened = flatten(coordinates);
      const indices = earcut(
        flattened.vertices,
        flattened.holes,
        flattened.dimensions
      );

      // 3. Конвертация координат Lng/Lat в WebGL Clip Space (Меркатор)
      const vertices = new Float32Array(flattened.vertices.length);
      for (let i = 0; i < flattened.vertices.length; i += 2) {
        const lng = flattened.vertices[i];
        const lat = flattened.vertices[i + 1];
        const mercator = maplibregl.MercatorCoordinate.fromLngLat({ lng, lat });
        vertices[i] = mercator.x;
        vertices[i + 1] = mercator.y;
      }

      this.indexCount = indices.length;

      // Динамическая поддержка Uint32 для сложных геометрий (> 65535 точек)
      const isWebGL2 = gl instanceof WebGL2RenderingContext;
      const extUint = !isWebGL2 ? gl.getExtension("OES_element_index_uint") : true;
      this.useUint32 = (isWebGL2 || !!extUint) && (flattened.vertices.length / 2 > 65535);

      // 4. Создание шейдеров
      const vertexSource = `
        uniform mat4 u_matrix;
        attribute vec2 a_pos;
        void main() {
          gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
        }
      `;
      // Fragment Shader выдает базовый цвет, но он будет полностью стёрт режимом смешивания.
      const fragmentSource = `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
      `;

      const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

      this.program = gl.createProgram()!;
      gl.attachShader(this.program, vertexShader);
      gl.attachShader(this.program, fragmentShader);
      gl.linkProgram(this.program);

      this.aPosLocation = gl.getAttribLocation(this.program, "a_pos");
      this.uMatrixLocation = gl.getUniformLocation(this.program, "u_matrix");

      // 5. Создание и привязка буферов (VBO / IBO)
      this.vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      this.ibo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
      const indexArray = this.useUint32 ? new Uint32Array(indices) : new Uint16Array(indices);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);

      // Триггерим репейнт карты после готовности буферов
      map.triggerRepaint();

    } catch (error) {
      console.error("Error initializing KyrgyzstanMaskLayer:", error);
    }
  }

  render(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    options: any
  ) {
    if (!this.program || !this.vbo || !this.ibo || this.indexCount === 0) return;

    gl.useProgram(this.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.enableVertexAttribArray(this.aPosLocation);
    gl.vertexAttribPointer(this.aPosLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.uniformMatrix4fv(
        this.uMatrixLocation,
        false,
        options.modelViewProjectionMatrix
    );

    // ==========================================
    // КЛИППИНГ-МАСКА (ERASER МЕТОД)
    // ==========================================
    gl.enable(gl.BLEND);
    // Умножаем Source (маску) и Destination (холст) на ZERO. 
    // Результат: полная прозрачность за пределами Кыргызстана.
    gl.blendFuncSeparate(gl.ZERO, gl.ZERO, gl.ZERO, gl.ZERO);
    
    // Рисуем поверх всех слоев, игнорируя глубину
    gl.disable(gl.DEPTH_TEST);
    // ==========================================

    const indexType = this.useUint32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
    gl.drawElements(gl.TRIANGLES, this.indexCount, indexType, 0);

    // Восстановление состояния WebGL, чтобы не сломать конвейер MapLibre
    gl.disableVertexAttribArray(this.aPosLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  onRemove(map: maplibregl.Map, gl: WebGLRenderingContext | WebGL2RenderingContext) {
    if (this.program) gl.deleteProgram(this.program);
    if (this.vbo) gl.deleteBuffer(this.vbo);
    if (this.ibo) gl.deleteBuffer(this.ibo);
    
    this.program = null;
    this.vbo = null;
    this.ibo = null;
  }

  private createShader(gl: WebGLRenderingContext | WebGL2RenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || "Error compiling shader");
    }
    return shader;
  }
}