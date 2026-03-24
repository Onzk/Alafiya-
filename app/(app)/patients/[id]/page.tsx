import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { QrCode, Stethoscope, User, Phone, AlertTriangle, Pencil } from 'lucide-react'
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
      personnesUrgence: true,
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
  const accesValide = !!accesActif || user.niveauAcces === 'SUPERADMIN'
  const modeUrgence = accesActif?.modeUrgence ?? false

  // Spécialités accessibles
  let specialitesAccessibles: { id: string; nom: string; code: string }[] = []

  if (modeUrgence || user.niveauAcces === 'SUPERADMIN') {
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dossier médical</h1>
        </div>
        <div className="flex items-center gap-2">
          {accesValide && (
            <Link href={`/patients/${params.id}/modifier`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            </Link>
          )}
          <Link href={`/patients/${params.id}/qrcode`}>
            <Button variant="outline" size="sm">
              <QrCode className="mr-2 h-4 w-4" />
              QR Code
            </Button>
          </Link>
        </div>
      </div>

      {!accesValide && (
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-lg p-4 text-sm text-orange-800 dark:text-orange-300">
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
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-900/50 rounded-lg p-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span><strong>MODE URGENCE ACTIF</strong> — Accès complet. Session tracée.</span>
        </div>
      )}

      {/* Infos patient */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-5 w-5 text-green-600 dark:text-emerald-400" />
            Informations patient
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-zinc-400 text-xs">Nom complet</p>
            <p className="font-semibold">{patient.nom.toUpperCase()} {patient.prenoms}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-zinc-400 text-xs">Genre</p>
            <Badge variant="outline">{patient.genre === 'M' ? 'Homme' : 'Femme'}</Badge>
          </div>
          <div>
            <p className="text-gray-500 dark:text-zinc-400 text-xs">Date de naissance</p>
            <p>{formatDate(patient.dateNaissance)}{patient.dateNaissancePresumee && ' (présumée)'}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">{calculerAge(patient.dateNaissance)} ans</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-zinc-400 text-xs">Adresse</p>
            <p>{patient.adresse}</p>
          </div>
          {patient.telephone && (
            <div>
              <p className="text-gray-500 dark:text-zinc-400 text-xs">Téléphone</p>
              <p>{patient.telephone}</p>
            </div>
          )}
          {patient.numeroCNI && (
            <div>
              <p className="text-gray-500 dark:text-zinc-400 text-xs">Numéro CNI</p>
              <p>{patient.numeroCNI}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personnes à prévenir */}
      <Card className="border-orange-100 dark:border-orange-900/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-orange-700 dark:text-orange-400">
            <Phone className="h-4 w-4" />
            Personnes à prévenir
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {patient.personnesUrgence.map((p, i) => (
            <div key={p.id} className={`grid sm:grid-cols-2 gap-3 text-sm ${i > 0 ? 'border-t border-orange-50 dark:border-orange-900/20 pt-4' : ''}`}>
              {patient.personnesUrgence.length > 1 && (
                <p className="sm:col-span-2 text-xs font-semibold text-orange-500 dark:text-orange-400 uppercase tracking-widest">
                  Contact {i + 1}
                </p>
              )}
              <div>
                <p className="text-gray-500 dark:text-zinc-400 text-xs">Nom</p>
                <p className="font-medium">{p.nom} {p.prenoms}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-zinc-400 text-xs">Relation</p>
                <p>{p.relation}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-zinc-400 text-xs">Téléphone</p>
                <p className="font-medium text-orange-700 dark:text-orange-400">{p.telephone}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-zinc-400 text-xs">Adresse</p>
                <p>{p.adresse}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Modules médicaux */}
      {accesValide && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-green-600 dark:text-emerald-400" />
            Modules médicaux
            {modeUrgence && <Badge variant="destructive" className="text-xs">Toutes spécialités</Badge>}
          </h2>

          {specialitesAccessibles.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-400 dark:text-zinc-500 text-sm">
                Aucune spécialité assignée. Contactez votre administrateur.
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {specialitesAccessibles.map((sp) => (
                <Link key={sp.id} href={`/patients/${params.id}/modules/${sp.id}`}>
                  <Card className="hover:border-green-300 dark:hover:border-emerald-700 hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-indigo-400/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 dark:text-indigo-300 text-xs font-bold">{sp.code.slice(0, 3)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{sp.nom}</p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500">Voir les consultations →</p>
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
