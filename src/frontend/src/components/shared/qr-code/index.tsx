import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { cn } from '@/lib';

interface QRCodeProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  className?: string;
  includeMargin?: boolean;
}

const QRCode: React.FC<QRCodeProps> = ({
  value,
  size = 256,
  level = 'L',
  className,
  includeMargin = true,
}) => {
  return (
    <div className={cn("flex justify-center", className)}>
      <QRCodeCanvas
        value={value}
        size={size}
        level={level}
        includeMargin={includeMargin}
        className="border rounded-lg"
      />
    </div>
  );
};

export default QRCode;