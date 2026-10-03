import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeRendererProps {
  value: string;
  width?: number;
  height?: number;
  format?: 'CODE128' | 'EAN13' | 'CODE39';
  displayValue?: boolean;
  fontSize?: number;
  textMargin?: number;
  margin?: number;
  lineColor?: string;
  background?: string;
  className?: string;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  width = 1.6,
  height = 48,
  format = 'CODE128',
  displayValue = true,
  fontSize = 12,
  textMargin = 4,
  margin = 0,
  lineColor = '#0f172a',
  background = 'transparent',
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format,
        width,
        height,
        displayValue,
        fontSize,
        font: 'JetBrains Mono, monospace',
        textMargin,
        lineColor,
        background,
        margin,
      });
    } catch (err) {
      console.warn('JsBarcode rendering fallback:', err);
    }
  }, [value, width, height, format, displayValue, fontSize, textMargin, margin, lineColor, background]);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg ref={svgRef} className="max-w-full overflow-visible" />
    </div>
  );
};
