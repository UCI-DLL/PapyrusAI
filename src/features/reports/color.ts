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
