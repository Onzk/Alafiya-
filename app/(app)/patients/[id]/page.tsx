import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { ArrowLeft, QrCode, Stethoscope, User, Phone, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, calculerAge } from '@/lib/utils'
import { SessionUser } from '@/types'

export default async function DossierPatientPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as unknown as SessionUser

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      creePar: { select: { nom: true, prenoms: true } },
      centreCreation: { select: { nom: true } },
      dossier: {
        include: {
          accesEnCours: {
            where: { finAcces: { gt: new Date() } },
          },
        },
      },
    },
  })

  if (!patient) redirect('/patients')

  const accesActif = patient.dossier?.accesEnCours.find(
    (a) => a.medecinId === user.id
  )
  const accesValide = !!accesActif || user.niveauAcces === 'MINISTERE'
  const modeUrgence = accesActif?.modeUrgence ?? false

  // Spécialités accessibles
  let specialitesAccessibles: { id: string; nom: string; code: string }[] = []

  if (modeUrgence || user.niveauAcces === 'MINISTERE') {
    specialitesAccessibles = await prisma.specialite.findMany({
      where: { estActive: true },
      select: { id: true, nom: true, code: true },
      orderBy: { nom: 'asc' },
    })
  } else if (accesValide && user.specialites.length > 0) {
    specialitesAccessibles = await prisma.specialite.findMany({
      where: { id: { in: user.specialites }, estActive: true },
      select: { id: true, nom: true, code: true },
      orderBy: { nom: 'asc' },
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/patients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Dossier médical</h1>
        </div>
        <Link href={`/patients/${params.id}/qrcode`}>
          <Button variant="outline" size="sm">
            <QrCode className="mr-2 h-4 w-4" />
            QR Code
          </Button>
        </Link>
      </div>

      {!accesValide && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <p className="font-semibold">Accès non autorisé ou expiré</p>
          </div>
          <p>Scannez le QR code du patient pour obtenir l&apos;autorisation d&apos;accès.</p>
          <Link href="/scanner">
            <Button size="sm" className="mt-3">Aller au scanner</Button>
          </Link>
        </div>
      )}

      {modeUrgence && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span><strong>MODE URGENCE ACTIF</strong> — Accès complet. Session tracée.</span>
        </div>
      )}

      {/* Infos patient */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-5 w-5 text-green-600" />
            Informations patient
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs">Nom complet</p>
            <p className="font-semibold">{patient.nom.toUpperCase()} {patient.prenoms}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Genre</p>
            <Badge variant="outline">{patient.genre === 'M' ? 'Homme' : 'Femme'}</Badge>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Date de naissance</p>
            <p>{formatDate(patient.dateNaissance)}{patient.dateNaissancePresumee && ' (présumée)'}</p>
            <p className="text-xs text-gray-400">{calculerAge(patient.dateNaissance)} ans</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Adresse</p>
            <p>{patient.adresse}</p>
          </div>
          {patient.telephone && (
            <div>
              <p className="text-gray-500 text-xs">Téléphone</p>
              <p>{patient.telephone}</p>
            </div>
          )}
          {patient.numeroCNI && (
            <div>
              <p className="text-gray-500 text-xs">Numéro CNI</p>
              <p>{patient.numeroCNI}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personne d'urgence */}
      <Card className="border-orange-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-orange-700">
            <Phone className="h-4 w-4" />
            Personne à prévenir
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 text-xs">Nom</p>
            <p className="font-medium">{patient.urgenceNom} {patient.urgencePrenoms}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Relation</p>
            <p>{patient.urgenceRelation}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Téléphone</p>
            <p className="font-medium text-orange-700">{patient.urgenceTel}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Adresse</p>
            <p>{patient.urgenceAdresse}</p>
          </div>
        </CardContent>
      </Card>

      {/* Modules médicaux */}
      {accesValide && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-green-600" />
            Modules médicaux
            {modeUrgence && <Badge variant="destructive" className="text-xs">Toutes spécialités</Badge>}
          </h2>

          {specialitesAccessibles.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-400 text-sm">
                Aucune spécialité assignée. Contactez votre administrateur.
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {specialitesAccessibles.map((sp) => (
                <Link key={sp.id} href={`/patients/${params.id}/modules/${sp.id}`}>
                  <Card className="hover:border-green-300 hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 text-xs font-bold">{sp.code.slice(0, 3)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{sp.nom}</p>
                        <p className="text-xs text-gray-400">Voir les consultations →</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
