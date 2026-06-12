// Espelha api/app/calc.py para mostrar o volume em tempo real no formulario.

export const FORMATS = {
  cilindric: { label: "Cilíndrico", keys: ["radius", "height"] },
  square: { label: "Quadrado", keys: ["side", "height"] },
  rectangular: { label: "Retangular", keys: ["width", "length", "height"] },
  conical: { label: "Cônico", keys: ["base_radius", "height"] },
  spherical: { label: "Esférico", keys: ["radius"] },
  custom: { label: "Personalizado", keys: [], custom: true },
};

export const KEY_LABELS = {
  radius: "Raio (cm)",
  height: "Altura (cm)",
  side: "Lado (cm)",
  width: "Largura (cm)",
  length: "Comprimento (cm)",
  base_radius: "Raio da base (cm)",
};

const PI = Math.PI;

// --- curva de calibracao do formato custom ---
export function normalizeProfile(raw) {
  const pts = (Array.isArray(raw) ? raw : [])
    .map((p) => [Number(p.h), Number(p.v)])
    .filter(([h, v]) => Number.isFinite(h) && Number.isFinite(v) && h >= 0 && v >= 0)
    .sort((a, b) => a[0] - b[0]);
  if (pts.length === 0 || pts[0][0] !== 0) pts.unshift([0, 0]);
  return pts;
}

function profileValid(pts) {
  if (pts.length < 2) return false;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i][0] <= pts[i - 1][0]) return false;
    if (pts[i][1] < pts[i - 1][1]) return false;
  }
  return true;
}

function interpVolume(pts, height) {
  if (height <= pts[0][0]) return pts[0][1];
  if (height >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 1; i < pts.length; i++) {
    const [h0, v0] = pts[i - 1];
    const [h1, v1] = pts[i];
    if (height <= h1) return v0 + ((v1 - v0) * (height - h0)) / (h1 - h0);
  }
  return pts[pts.length - 1][1];
}

export function totalHeight(format, d) {
  if (format === "spherical") return 2 * d.radius;
  if (format === "custom") {
    const pts = normalizeProfile(d.profile);
    return pts[pts.length - 1][0];
  }
  return d.height;
}

export function totalVolume(format, d) {
  if (format === "custom") {
    const pts = normalizeProfile(d.profile);
    return pts[pts.length - 1][1];
  }
  switch (format) {
    case "cilindric":
      return PI * d.radius ** 2 * d.height;
    case "square":
      return d.side ** 2 * d.height;
    case "rectangular":
      return d.width * d.length * d.height;
    case "conical":
      return (1 / 3) * PI * d.base_radius ** 2 * d.height;
    case "spherical":
      return (4 / 3) * PI * d.radius ** 3;
    default:
      return 0;
  }
}

export function filledVolume(format, d, distanceFromLid) {
  const hTotal = totalHeight(format, d);
  const dist = Math.min(Math.max(distanceFromLid, 0), hTotal);
  const hFilled = hTotal - dist;

  if (format === "custom") {
    return interpVolume(normalizeProfile(d.profile), hFilled);
  }

  switch (format) {
    case "cilindric":
      return PI * d.radius ** 2 * hFilled;
    case "square":
      return d.side ** 2 * hFilled;
    case "rectangular":
      return d.width * d.length * hFilled;
    case "conical": {
      const r = d.base_radius;
      const h = d.height;
      const full = (1 / 3) * PI * r ** 2 * h;
      const emptyTop = (1 / 3) * PI * (r * dist / h) ** 2 * dist;
      return full - emptyTop;
    }
    case "spherical": {
      const R = d.radius;
      const cap = (PI * dist ** 2 * (3 * R - dist)) / 3;
      return (4 / 3) * PI * R ** 3 - cap;
    }
    default:
      return 0;
  }
}

// Retorna true se todas as chaves do formato estao preenchidas com numeros > 0
export function dimensionsReady(format, dims) {
  if (format === "custom") {
    const pts = normalizeProfile(dims.profile);
    return profileValid(pts) && pts[pts.length - 1][1] > 0;
  }
  return FORMATS[format].keys.every(
    (k) => typeof dims[k] === "number" && dims[k] > 0
  );
}

export const fmtNum = (n, dec = 2) =>
  Number.isFinite(n) ? n.toLocaleString("pt-BR", { maximumFractionDigits: dec }) : "-";
