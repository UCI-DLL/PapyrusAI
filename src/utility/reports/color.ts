// Helper function for graphs
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    Math.round(
      255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))
    );

  return `#${[f(0), f(8), f(4)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")}`;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

export function colorToHex(input: string): string {
  const parts = input.trim().split(/\s+/);

  if (parts.length !== 3) throw new Error("Invalid color format");

  if (parts[1].includes("%")) {
    // HSL format
    const [h, s, l] = parts.map((val, i) =>
      i === 0 ? parseFloat(val) : parseFloat(val.replace("%", ""))
    );
    return hslToHex(h, s, l);
  } else {
    // RGB format
    const [r, g, b] = parts.map(Number);
    return rgbToHex(r, g, b);
  }
}

// Color palette options for different accessibility needs
export const COLOR_PALETTES = {
  // Original UCI accent colors
  default: [
    "#6aa2b8", // accent
    "#f8cf56", // athletics-gold
    "#3f9c35", // green
    "#00639e", // royal-blue
    "#7c109a", // bright-purple
    "#f7eb5f", // light-yellow
    "#7ab800", // lime-green
    "#d462ad", // magenta
  ] as const,

  // Colorblind-friendly palette (ColorBrewer Set1 inspired)
  colorblind: [
    "#e41a1c", // red
    "#377eb8", // blue
    "#4daf4a", // green
    "#984ea3", // purple
    "#ff7f00", // orange
    "#ffff33", // yellow
    "#a65628", // brown
    "#f781bf", // pink
  ] as const,
} as const;

export const PLOT_COLOR_PALETTE = COLOR_PALETTES.colorblind;
