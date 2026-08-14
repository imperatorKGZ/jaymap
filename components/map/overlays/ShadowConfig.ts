export const ShadowConfig = {
  enabled: true,

  // Холодный серо-синий оттенок
  color: [
    36 / 255,
    45 / 255,
    58 / 255,
  ] as [number, number, number],

  // Очень мягкая тень
  opacity: 0.30,

  // Большое размытие
  blurRadius: 10,

  quality: "High" as ShadowQuality,

  getResolutionScale(): number {
    switch (this.quality) {
      case "High":
        return 1.0;
      case "Medium":
        return 0.5;
      case "Low":
        return 0.25;
    }
  }
};