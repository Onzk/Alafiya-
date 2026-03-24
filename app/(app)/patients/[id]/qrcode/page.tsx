import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { QRCodeDisplay } from '@/components/qrcode/QRCodeDisplay'
import { PrintButton } from './PrintButton'
import { QRUnlockButton } from './QRUnlockButton'
import { genererURLQR } from '@/lib/qrcode'
import { formatDate, calculerAge } from '@/lib/utils'
import { ShieldOff, Clock } from 'lucide-react'

export default async function QRCodePage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    select: {
      id: true, nom: true, prenoms: true, genre: true,
      dateNaissance: true, dateNaissancePresumee: true,
      qrToken: true, qrGeneratedAt: true,
    },
  })
  if (!patient) redirect('/patients')

  const now = new Date()
  const createdAt = patient.qrGeneratedAt
  const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000) // 24 heures
  const qrAccessible = expiresAt > now

  // Temps restant formaté
  let tempsRestant = ''
  if (qrAccessible) {
    const diff = expiresAt.getTime() - now.getTime()
    const heures = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    tempsRestant = heures > 0 ? `${heures}h${minutes.toString().padStart(2, '0')}` : `${minutes} min`
  }

  const nomComplet = `${patient.nom.toUpperCase()} ${patient.prenoms}`
  const age = calculerAge(patient.dateNaissance)
  const dateNaiss = formatDate(patient.dateNaissance)

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">QR Code patient</h1>
      </div>

      <Card className="dark:bg-zinc-950 dark:border-zinc-800">
        <CardContent className="p-6 text-center space-y-4">
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{nomComplet}</p>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
              {patient.genre === 'M' ? 'Homme' : 'Femme'} •{' '}
              {age} ans •{' '}
              Né(e) le {dateNaiss}
              {patient.dateNaissancePresumee && ' (présumée)'}
            </p>
          </div>

          {qrAccessible ? (
            <>
              <QRCodeDisplay value={genererURLQR(patient.qrToken)} />

              <p className="text-xs text-slate-400 dark:text-zinc-500 break-all">
                {patient.qrToken.slice(0, 16)}...
              </p>

              {/* Expiration */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <Clock className="h-3.5 w-3.5" />
                <span>Accès valide encore <strong>{tempsRestant}</strong></span>
              </div>

              <div className="flex gap-3 justify-center">
                <PrintButton
                  nom={patient.nom.toUpperCase()}
                  prenoms={patient.prenoms}
                  genre={patient.genre}
                  age={age}
                  dateNaissance={dateNaiss}
                  dateNaissancePresumee={patient.dateNaissancePresumee ?? false}
                />
                <Link href={`/patients/${params.id}`}>
                  <Button variant="outline">Voir le dossier</Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Accès bloqué */}
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                  <ShieldOff className="h-8 w-8 text-slate-400 dark:text-zinc-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">QR Code non accessible</p>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 max-w-xs">
                    Le délai de 24h est dépassé. Le patient doit se présenter physiquement pour que le QR code puisse être affiché à nouveau.
                  </p>
                </div>
              </div>

              <QRUnlockButton patientId={patient.id} />

              <Link href={`/patients/${params.id}`}>
                <Button variant="outline" className="w-full">Voir le dossier</Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-400">
        <p className="font-medium mb-1">Confidentialité</p>
        <p>
          Le QR code est accessible 24h après création. Passé ce délai, la présence physique du patient est requise pour le réafficher.
        </p>
      </div>
    </div>
  )
}
