'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

interface PrintButtonProps {
  nom: string
  prenoms: string
  genre: string
  age: number
  dateNaissance: string
  dateNaissancePresumee: boolean
}

export function PrintButton({ nom, prenoms, genre, age, dateNaissance, dateNaissancePresumee }: PrintButtonProps) {
  function handlePrint() {
    // Récupère le SVG du QR code déjà rendu dans la page
    const svgEl = document.querySelector('.qr-display svg')
    const svgHtml = svgEl ? svgEl.outerHTML : ''

    const win = window.open('', '_blank', 'width=420,height=620')
    if (!win) return

    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>QR Code — ${prenoms} ${nom}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: sans-serif; display: flex; justify-content: center; padding: 32px; }
    .card { text-align: center; border: 2px solid #e5e7eb; border-radius: 16px; padding: 32px 24px; max-width: 320px; width: 100%; }
    .name { font-size: 20px; font-weight: 800; color: #111827; margin-bottom: 6px; }
    .meta { font-size: 13px; color: #6b7280; margin-bottom: 24px; }
    .qr-wrap { display: inline-flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px; border: 2px solid #e5e7eb; border-radius: 12px; margin-bottom: 16px; }
    .qr-wrap svg { width: 220px; height: 220px; }
    .brand { font-size: 11px; color: #9ca3af; font-family: monospace; }
    .footer { font-size: 11px; color: #9ca3af; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <p class="name">${prenoms} ${nom}</p>
    <p class="meta">${genre === 'M' ? 'Homme' : 'Femme'} · ${age} ans · Né(e) le ${dateNaissance}${dateNaissancePresumee ? ' (présumée)' : ''}</p>
    <div class="qr-wrap">
      ${svgHtml}
      <span class="brand">Alafiya Plus</span>
    </div>
    <p class="footer">Dossier médical numérique — Alafiya Plus</p>
  </div>
  <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
</body>
</html>`)
    win.document.close()
  }

  return (
    <Button variant="outline" onClick={handlePrint} className="gap-1.5">
      <Printer className="h-4 w-4" />
      Imprimer
    </Button>
  )
}
