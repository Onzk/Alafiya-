import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { QrCode, Pencil, ArrowLeft, CreditCard, TextQuote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SessionUser } from '@/types'
import { DossierPatientClient } from './DossierPatientClient'

export default async function DossierPatientPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as unknown as SessionUser

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      personnesUrgence: true,
      dossier: {
        include: {
          accesEnCours: {
            where: { finAcces: { gt: new Date() } },
          },
        },
      },
      centreCreation: {
        select: { id: true, nom: true, adresse: true, telephone: true, email: true, region: true, prefecture: true, type: true, logo: true },
      },
      creePar: {
        select: { id: true, nom: true, prenoms: true, email: true, telephone: true, photo: true, niveauAcces: true },
      },
    },
  })

  if (!patient) redirect('/patients')

  const accesActif = patient.dossier?.accesEnCours.find(
    (a) => a.medecinId === user.id
  )
  const isAdmin = user.niveauAcces === 'SUPERADMIN' || user.niveauAcces === 'ADMIN_CENTRE'
  const accesValide = !!accesActif || isAdmin
  const modeUrgence = accesActif?.modeUrgence ?? false

  // Le bouton QR est visible aux admins et aux médecins ayant déjà un AccesDossier (même expiré)
  const peutVoirQR = isAdmin || (patient.dossier
    ? await prisma.accesDossier.findFirst({ where: { dossierId: patient.dossier.id, medecinId: user.id } }) !== null
    : false
  )

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
    <div className="max-w-3xl mx-auto space-y-5">

      <Link href="/patients" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Retour aux patients
      </Link>

      {/* ── En-tête ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dossier médical</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            {patient.nom.toUpperCase()} {patient.prenoms}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {accesValide && (
            <Link href={`/patients/${params.id}/modifier`}>
              <Button variant="warning" size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            </Link>
          )}
          {accesValide && (
            <Link href={`/patients/${params.id}/documents`}>
              <Button variant="secondary" size="sm">
                <TextQuote className="mr-2 h-4 w-4" />
                ID
              </Button>
            </Link>
          )}
          {peutVoirQR && (
            <Link href={`/patients/${params.id}/qrcode`}>
              <Button variant="default" size="sm">
                <QrCode className="mr-2 h-4 w-4" />
                QR Code
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* ── Contenu tabulé ── */}
      <DossierPatientClient
        patient={{
          nom: patient.nom,
          prenoms: patient.prenoms,
          genre: patient.genre,
          dateNaissance: patient.dateNaissance,
          dateNaissancePresumee: patient.dateNaissancePresumee,
          adresse: patient.adresse,
          telephone: patient.telephone ?? null,
          numeroCNI: patient.numeroCNI ?? null,
          photo: patient.photo ?? null,
          personnesUrgence: patient.personnesUrgence,
          createdAt: patient.createdAt,
        }}
        centreCreation={patient.centreCreation}
        creePar={patient.creePar}
        patientId={params.id}
        accesValide={accesValide}
        modeUrgence={modeUrgence}
        specialitesAccessibles={specialitesAccessibles}
      />

    </div>
  )
}
