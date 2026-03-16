import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { QRCodeDisplay } from '@/components/qrcode/QRCodeDisplay'
import { genererURLQR } from '@/lib/qrcode'
import { formatDate, calculerAge } from '@/lib/utils'

export default async function QRCodePage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const patient = await prisma.patient.findUnique({ where: { id: params.id } })
  if (!patient) redirect('/patients')

  const qrUrl = genererURLQR(patient.qrToken)

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/patients/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">QR Code patient</h1>
      </div>

      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <div>
            <p className="text-xl font-bold text-gray-900">
              {patient.nom.toUpperCase()} {patient.prenoms}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {patient.genre === 'M' ? 'Homme' : 'Femme'} •{' '}
              {calculerAge(patient.dateNaissance)} ans •{' '}
              Né(e) le {formatDate(patient.dateNaissance)}
              {patient.dateNaissancePresumee && ' (présumée)'}
            </p>
          </div>

          <QRCodeDisplay value={qrUrl} />

          <p className="text-xs text-gray-400 break-all">{patient.qrToken.slice(0, 16)}...</p>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => {}} className="print:hidden">
              Imprimer
            </Button>
            <Link href={`/patients/${params.id}`}>
              <Button variant="outline">Voir le dossier</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">Instructions</p>
        <p>
          Ce QR code donne accès au dossier médical après validation par OTP SMS ou signature numérique.
        </p>
      </div>
    </div>
  )
}
