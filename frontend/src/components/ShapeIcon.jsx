import { useId } from "react";

// Geometria de cada formato num viewBox 100x100.
// clipD = regiao interna (usada para "encher" o conteudo)
// yTop/yBottom = limites verticais do interior (p/ mapear o nivel)
const SHAPES = {
  cilindric: {
    yTop: 18,
    yBottom: 82,
    clipD: "M22,18 V82 A28,8 0 0 0 78,82 V18 A28,8 0 0 1 22,18 Z",
    outline: (
      <>
        <path d="M22,18 V82 A28,8 0 0 0 78,82 V18" fill="none" />
        <ellipse cx="50" cy="18" rx="28" ry="8" fill="none" />
      </>
    ),
  },
  square: {
    yTop: 30,
    yBottom: 82,
    clipD: "M30,30 H70 V82 H30 Z",
    outline: (
      <>
        <path d="M30,30 H70 V82 H30 Z" fill="none" />
        <path d="M30,30 L42,20 H82 L70,30" fill="none" />
        <path d="M70,30 L82,20 V72 L70,82" fill="none" />
      </>
    ),
  },
  rectangular: {
    yTop: 34,
    yBottom: 82,
    clipD: "M20,34 H68 V82 H20 Z",
    outline: (
      <>
        <path d="M20,34 H68 V82 H20 Z" fill="none" />
        <path d="M20,34 L32,24 H80 L68,34" fill="none" />
        <path d="M68,34 L80,24 V72 L68,82" fill="none" />
      </>
    ),
  },
  conical: {
    yTop: 16,
    yBottom: 80,
    clipD: "M50,16 L80,80 A30,8 0 0 1 20,80 Z",
    outline: (
      <>
        <path d="M50,16 L80,80 M50,16 L20,80" fill="none" />
        <ellipse cx="50" cy="80" rx="30" ry="8" fill="none" />
      </>
    ),
  },
  spherical: {
    yTop: 16,
    yBottom: 84,
    clipD: "M50,16 A34,34 0 1 0 50,84 A34,34 0 1 0 50,16 Z",
    outline: <circle cx="50" cy="50" r="34" fill="none" />,
  },
  custom: {
    // silhueta de garrafa (gargalo + ombro + corpo)
    yTop: 14,
    yBottom: 90,
    clipD:
      "M42,18 H58 V30 C58,36 70,38 70,48 V82 Q70,90 62,90 H38 Q30,90 30,82 V48 C30,38 42,36 42,30 Z",
    outline: (
      <>
        <path d="M44,14 H56 V18 H44 Z" fill="none" />
        <path
          d="M42,18 H58 V30 C58,36 70,38 70,48 V82 Q70,90 62,90 H38 Q30,90 30,82 V48 C30,38 42,36 42,30 Z"
          fill="none"
        />
      </>
    ),
  },
};

export default function ShapeIcon({ format, fill = null, size = 96, className = "" }) {
  const id = useId().replace(/:/g, "");
  const shape = SHAPES[format] || SHAPES.cilindric;

  // nivel do liquido (se fill informado entre 0 e 100)
  let liquidY = null;
  if (fill != null) {
    const p = Math.min(Math.max(fill, 0), 100) / 100;
    liquidY = shape.yBottom - p * (shape.yBottom - shape.yTop);
  }

  return (
    <svg
      className={`shape-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {liquidY != null && (
        <clipPath id={`clip-${id}`}>
          <path d={shape.clipD} />
        </clipPath>
      )}
      {liquidY != null && (
        <g clipPath={`url(#clip-${id})`}>
          <rect
            x="0"
            y={liquidY}
            width="100"
            height={shape.yBottom - liquidY + 4}
            className="shape-liquid"
            stroke="none"
          />
        </g>
      )}
      {shape.outline}
    </svg>
  );
}
