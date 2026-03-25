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
  photo: string | null
}

export function PrintButton({ nom, prenoms, genre, age, dateNaissance, dateNaissancePresumee, photo }: PrintButtonProps) {
  function handlePrint() {
    const svgEl = document.querySelector('.qr-display svg')
    const svgHtml = svgEl ? svgEl.outerHTML : ''

    const origin = window.location.origin
    const photoUrl = photo ? `${origin}${photo}` : null

    const genreLabel = genre === 'M' ? 'Homme' : 'Femme'
    const initiales = `${prenoms.charAt(0)}${nom.charAt(0)}`.toUpperCase()

    const photoSection = photoUrl
      ? `<div class="avatar"><img src="${photoUrl}" alt="${prenoms} ${nom}" /></div>`
      : `<div class="avatar avatar-placeholder"><span>${initiales}</span></div>`

    const win = window.open('', '_blank', 'width=520,height=760')
    if (!win) return

    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Carte Alafiya — ${prenoms} ${nom}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      background: #f3f4f6;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px;
    }

    .page {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    /* ── Carte principale ── */
    .card {
      width: 340px;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08);
    }

    /* ── En-tête vert dégradé ── */
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%);
      padding: 20px 24px 28px;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -30px; right: -30px;
      width: 120px; height: 120px;
      border-radius: 50%;
      background: rgba(255,255,255,0.08);
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: -20px; left: -20px;
      width: 80px; height: 80px;
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
    }

    .brand-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .brand-logo {
      width: 28px; height: 28px;
      border-radius: 6px;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .brand-logo img {
      width: 20px; height: 20px;
      object-fit: contain;
    }
    .brand-name {
      font-size: 14px;
      font-weight: 700;
      color: rgba(255,255,255,0.95);
      letter-spacing: 0.3px;
    }
    .brand-subtitle {
      font-size: 9px;
      font-weight: 500;
      color: rgba(255,255,255,0.65);
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-top: 1px;
    }

    .patient-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    /* Avatar */
    .avatar {
      width: 56px; height: 56px;
      border-radius: 50%;
      overflow: hidden;
      border: 2.5px solid rgba(255,255,255,0.8);
      flex-shrink: 0;
      background: rgba(255,255,255,0.15);
    }
    .avatar img {
      width: 100%; height: 100%;
      object-fit: cover;
    }
    .avatar-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .avatar-placeholder span {
      font-size: 18px;
      font-weight: 700;
      color: rgba(255,255,255,0.9);
    }

    .patient-info { flex: 1; min-width: 0; }
    .patient-name {
      font-size: 17px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .patient-name-first {
      font-size: 13px;
      font-weight: 500;
      color: rgba(255,255,255,0.8);
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Corps de la carte ── */
    .body {
      padding: 20px 24px;
    }

    /* Ligne infos patient */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 20px;
    }
    .info-item {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 10px 12px;
    }
    .info-label {
      font-size: 9px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 3px;
    }
    .info-value {
      font-size: 13px;
      font-weight: 600;
      color: #111827;
    }

    /* QR code section */
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .qr-label {
      font-size: 10px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .qr-box {
      background: #ffffff;
      border: 1.5px solid #e5e7eb;
      border-radius: 14px;
      padding: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .qr-box svg { width: 180px; height: 180px; display: block; }
    .qr-hint {
      font-size: 10px;
      color: #9ca3af;
      text-align: center;
      line-height: 1.4;
    }

    /* ── Pied de carte ── */
    .footer {
      border-top: 1px solid #f3f4f6;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .footer-left {
      font-size: 9px;
      color: #9ca3af;
      font-weight: 500;
    }
    .footer-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 20px;
      padding: 3px 8px;
    }
    .footer-badge-dot {
      width: 5px; height: 5px;
      border-radius: 50%;
      background: #10b981;
    }
    .footer-badge-text {
      font-size: 9px;
      font-weight: 600;
      color: #059669;
    }

    /* ── Instruction sous la carte ── */
    .instruction {
      width: 340px;
      text-align: center;
      font-size: 11px;
      color: #6b7280;
      line-height: 1.5;
    }

    @media print {
      body { background: white; padding: 16px; }
      .card { box-shadow: 0 0 0 1px #e5e7eb; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="card">

      <!-- En-tête -->
      <div class="header">
        <div class="brand-row">
          <div class="brand-logo">
            <img src="${origin}/logo.png" alt="Alafiya" onerror="this.style.display='none'" />
          </div>
          <div>
            <div class="brand-name">Alafiya Plus</div>
            <div class="brand-subtitle">Dossier médical numérique</div>
          </div>
        </div>
        <div class="patient-row">
          ${photoSection}
          <div class="patient-info">
            <div class="patient-name">${nom}</div>
            <div class="patient-name-first">${prenoms}</div>
          </div>
        </div>
      </div>

      <!-- Corps -->
      <div class="body">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Genre</div>
            <div class="info-value">${genreLabel}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Âge</div>
            <div class="info-value">${age} ans</div>
          </div>
          <div class="info-item" style="grid-column: span 2;">
            <div class="info-label">Date de naissance</div>
            <div class="info-value">${dateNaissance}${dateNaissancePresumee ? ' <span style="font-size:11px;font-weight:400;color:#9ca3af">(présumée)</span>' : ''}</div>
          </div>
        </div>

        <div class="qr-section">
          <div class="qr-label">QR Code d'accès au dossier</div>
          <div class="qr-box">
            ${svgHtml}
          </div>
          <div class="qr-hint">Scannez ce code pour accéder au dossier médical</div>
        </div>
      </div>

      <!-- Pied -->
      <div class="footer">
        <div class="footer-left">N'di Solutions • alafiya.plus</div>
        <div class="footer-badge">
          <div class="footer-badge-dot"></div>
          <div class="footer-badge-text">Actif</div>
        </div>
      </div>
    </div>

    <div class="instruction">
      Présentez cette carte à votre professionnel de santé pour accéder à votre dossier médical.
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print()
      window.onafterprint = function() { window.close() }
    }
  </script>
</body>
</html>`)
    win.document.close()
  }

  return (
    <Button variant="outline" onClick={handlePrint} className="gap-1.5">
      <Printer className="h-4 w-4" />
      Imprimer la carte
    </Button>
  )
}
