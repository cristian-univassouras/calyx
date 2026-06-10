import React from 'react';
import Svg, {
  Defs, ClipPath, Path, Rect,
  Ellipse, Line, Circle, G,
} from 'react-native-svg';
import { theme } from '../src/theme';

let _uid = 0;

const SHAPES = {
  cilindric: {
    yTop: 18, yBottom: 82,
    clipD: 'M22,18 V82 A28,8 0 0 0 78,82 V18 A28,8 0 0 1 22,18 Z',
    Outline: ({ c, w }) => (
      <G>
        <Ellipse cx="50" cy="18" rx="28" ry="8" fill="none" stroke={c} strokeWidth={w} />
        <Line x1="22" y1="18" x2="22" y2="82" stroke={c} strokeWidth={w} />
        <Line x1="78" y1="18" x2="78" y2="82" stroke={c} strokeWidth={w} />
        <Ellipse cx="50" cy="82" rx="28" ry="8" fill="none" stroke={c} strokeWidth={w} />
      </G>
    ),
  },
  square: {
    yTop: 30, yBottom: 82,
    clipD: 'M30,30 H70 V82 H30 Z',
    Outline: ({ c, w }) => (
      <G>
        <Path d="M22,22 L70,22 L78,30 L78,82 L30,82 L22,74 Z" fill="none" stroke={c} strokeWidth={w} />
        <Line x1="22" y1="22" x2="30" y2="30" stroke={c} strokeWidth={w} />
        <Line x1="70" y1="22" x2="78" y2="30" stroke={c} strokeWidth={w} />
        <Line x1="30" y1="30" x2="70" y2="30" stroke={c} strokeWidth={w} />
        <Line x1="30" y1="30" x2="30" y2="82" stroke={c} strokeWidth={w} />
      </G>
    ),
  },
  rectangular: {
    yTop: 34, yBottom: 82,
    clipD: 'M20,34 H68 V82 H20 Z',
    Outline: ({ c, w }) => (
      <G>
        <Path d="M12,26 L68,26 L80,34 L80,82 L20,82 L12,74 Z" fill="none" stroke={c} strokeWidth={w} />
        <Line x1="12" y1="26" x2="20" y2="34" stroke={c} strokeWidth={w} />
        <Line x1="68" y1="26" x2="80" y2="34" stroke={c} strokeWidth={w} />
        <Line x1="20" y1="34" x2="68" y2="34" stroke={c} strokeWidth={w} />
        <Line x1="20" y1="34" x2="20" y2="82" stroke={c} strokeWidth={w} />
      </G>
    ),
  },
  conical: {
    yTop: 16, yBottom: 80,
    clipD: 'M50,16 L80,80 A30,8 0 0 1 20,80 Z',
    Outline: ({ c, w }) => (
      <G>
        <Line x1="50" y1="16" x2="20" y2="80" stroke={c} strokeWidth={w} />
        <Line x1="50" y1="16" x2="80" y2="80" stroke={c} strokeWidth={w} />
        <Ellipse cx="50" cy="80" rx="30" ry="8" fill="none" stroke={c} strokeWidth={w} />
      </G>
    ),
  },
  spherical: {
    yTop: 16, yBottom: 84,
    clipD: 'M50,16 A34,34 0 1 0 50,84 A34,34 0 1 0 50,16 Z',
    Outline: ({ c, w }) => (
      <G>
        <Circle cx="50" cy="50" r="34" fill="none" stroke={c} strokeWidth={w} />
      </G>
    ),
  },
  custom: {
    yTop: 14, yBottom: 90,
    clipD: 'M42,18 H58 V30 C58,36 70,38 70,48 V82 Q70,90 62,90 H38 Q30,90 30,82 V48 C30,38 42,36 42,30 Z',
    Outline: ({ c, w }) => (
      <G>
        <Path
          d="M42,18 H58 V30 C58,36 70,38 70,48 V82 Q70,90 62,90 H38 Q30,90 30,82 V48 C30,38 42,36 42,30 Z"
          fill="none" stroke={c} strokeWidth={w}
        />
        <Line x1="42" y1="14" x2="42" y2="18" stroke={c} strokeWidth={w} />
        <Line x1="58" y1="14" x2="58" y2="18" stroke={c} strokeWidth={w} />
        <Line x1="40" y1="14" x2="60" y2="14" stroke={c} strokeWidth={w} />
      </G>
    ),
  },
};

export default function ShapeIcon({ format, fill = null, size = 96 }) {
  const shape = SHAPES[format] || SHAPES.cilindric;
  const clipId = React.useRef(`sc${++_uid}`).current;
  const sw = (3 * 100) / size;
  const { Outline } = shape;

  let liquidY = null;
  if (fill != null) {
    const p = Math.min(Math.max(fill, 0), 100) / 100;
    liquidY = shape.yBottom - p * (shape.yBottom - shape.yTop);
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {liquidY != null && (
        <Defs>
          <ClipPath id={clipId}>
            <Path d={shape.clipD} />
          </ClipPath>
        </Defs>
      )}
      {liquidY != null && (
        <Rect
          x="0"
          y={liquidY}
          width="100"
          height={shape.yBottom - liquidY + 4}
          fill={theme.honey}
          fillOpacity={0.45}
          clipPath={`url(#${clipId})`}
        />
      )}
      <Outline c={theme.accent} w={sw} />
    </Svg>
  );
}
