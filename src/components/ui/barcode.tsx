import { useMemo } from 'react';

const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312',
  '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
  '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131',
  '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
  '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
  '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321',
  '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224',
  '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114',
  '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112',
  '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113',
  '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412',
  '211214', '211232', '2331112',
];

function encode128(text: string): number[] {
  const clean = text.replace(/[^\x20-\x7e]/g, '').slice(0, 48);
  const values = [104];
  for (let i = 0; i < clean.length; i++) {
    values.push(clean.charCodeAt(i) - 32);
  }
  let check = values[0];
  for (let i = 1; i < values.length; i++) {
    check += values[i] * i;
  }
  values.push(check % 103);
  values.push(106);
  return values;
}

interface BarcodeProps {
  value: string;
  height?: number;
  className?: string;
}

export function Barcode({ value, height = 36, className }: BarcodeProps) {
  const bars = useMemo(() => {
    const codes = encode128(value);
    const pattern = codes.map((c) => CODE128_PATTERNS[c] ?? '212222').join('');
    const widths: { dark: boolean; width: number }[] = [];
    let dark = true;
    for (const ch of pattern) {
      widths.push({ dark, width: Number(ch) });
      dark = !dark;
    }
    const module = 1;
    const total = widths.reduce((s, w) => s + w.width, 0) * module;
    return { widths, total };
  }, [value]);

  let x = 0;
  const rects = bars.widths.map((b, i) => {
    const rect = b.dark ? (
      <rect key={i} x={x} y={0} width={b.width} height={height} fill="#000" />
    ) : null;
    x += b.width;
    return rect;
  });

  return (
    <svg
      className={className}
      height={height}
      width={bars.total}
      viewBox={`0 0 ${bars.total} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={value}
    >
      {rects}
    </svg>
  );
}

export { encode128 };

export function barcodeSvgMarkup(value: string, height = 36): string {
  const codes = encode128(value);
  const pattern = codes.map((c) => CODE128_PATTERNS[c] ?? '212222').join('');
  const widths: { dark: boolean; width: number }[] = [];
  let dark = true;
  for (const ch of pattern) {
    widths.push({ dark, width: Number(ch) });
    dark = !dark;
  }
  const total = widths.reduce((s, w) => s + w.width, 0);
  let x = 0;
  const rects: string[] = [];
  for (const b of widths) {
    if (b.dark) rects.push(`<rect x="${x}" y="0" width="${b.width}" height="${height}" fill="#000"/>`);
    x += b.width;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" height="${height}" width="${total}" viewBox="0 0 ${total} ${height}">${rects.join('')}</svg>`;
}
