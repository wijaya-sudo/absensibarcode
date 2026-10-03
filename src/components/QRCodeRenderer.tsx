import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeRendererProps {
  value: string;
  size?: number;
  className?: string;
  darkColor?: string;
  lightColor?: string;
}

export const QRCodeRenderer: React.FC<QRCodeRendererProps> = ({
  value,
  size = 110,
  className = '',
  darkColor = '#0f172a',
  lightColor = '#ffffff',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, {
      width: size * 2, // render 2x for retina sharpness
      margin: 1,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    })
      .then(url => setDataUrl(url))
      .catch(err => console.error('QR code generation error:', err));
  }, [value, size, darkColor, lightColor]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-slate-100 flex items-center justify-center animate-pulse ${className}`}
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`QR Code ${value}`}
      width={size}
      height={size}
      className={`inline-block ${className}`}
    />
  );
};
