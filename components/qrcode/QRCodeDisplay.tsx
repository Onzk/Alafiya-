'use client'

import { QRCodeSVG } from 'qrcode.react'

interface QRCodeDisplayProps {
  value: string
  size?: number
}

export function QRCodeDisplay({ value, size = 220 }: QRCodeDisplayProps) {
  return (
    <div className="inline-flex flex-col items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-xl shadow-inner">
      <QRCodeSVG
        value={value}
        size={size}
        level="H"
        includeMargin
        imageSettings={{
          src: '/icons/icon-72x72.png',
          x: undefined,
          y: undefined,
          height: 28,
          width: 28,
          excavate: true,
        }}
      />
      <p className="text-xs text-gray-400 font-mono">Alafiya Plus</p>
    </div>
  )
}
