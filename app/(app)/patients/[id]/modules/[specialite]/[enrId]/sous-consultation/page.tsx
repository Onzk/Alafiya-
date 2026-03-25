import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { ArrowLeft, CornerDownRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ConsultationCard } from '@/components/dossier/ConsultationCard'
import { FormWrapper } from './FormWrapper'
import { SessionUser } from '@/types'

function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  const jour = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return { jour: jour.charAt(0).toUpperCase() + jour.slice(1), heure }
}

export default async function SousConsultationPage({
  params,
}: {
  params: { id: string; specialite: string; enrId: string }
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as unknown as SessionUser

  const enrSelect = {
    medecin:    { select: { nom: true, prenoms: true, telephone: true, photo: true, role: { select: { nom: true } } } },
    centre:     { select: { nom: true, adresse: true, region: true, prefecture: true, type: true, telephone: true, email: true, logo: true } },
    documents:  { orderBy: { createdAt: 'asc' as const } },
    ordonnances:{ orderBy: { createdAt: 'asc' as const } },
  }

  const [patient, specialite, enr] = await Promise.all([
    prisma.patient.findUnique({
      where: { id: params.id },
      select: { nom: true, prenoms: true, dossier: { select: { id: true } } },
    }),
    prisma.specialite.findUnique({ where: { id: params.specialite } }),
    prisma.enregistrementMedical.findUnique({
      where: { id: params.enrId },
      include: {
        ...enrSelect,
        sousConsultations: {
          include: enrSelect,
          orderBy: { dateConsultation: 'asc' },
        },
      },
    }),
  ])

  if (!patient || !specialite || !patient.dossier || !enr) redirect('/patients')
  if (enr.dossierId !== patient.dossier.id) redirect('/patients')

  if (enr.parentId || enr.statut === 'TERMINEE') {
    redirect(`/patients/${params.id}/modules/${params.specialite}`)
  }

  const dossierId = patient.dossier.id

  const accesValide =
    user.niveauAcces === 'SUPERADMIN' ||
    !!(await prisma.accesDossier.findFirst({
      where: { dossierId, medecinId: user.id, finAcces: { gt: new Date() } },
    }))

  if (!accesValide) redirect('/scanner')

  const moduleUrl = `/patients/${params.id}/modules/${params.specialite}`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function mapEnr(e: any, parentId: string | null = null) {
    const { jour, heure } = formatDate(e.dateConsultation)
    return {
      id:              e.id,
      patientId:       params.id,
      dossierId,
      specialiteId:    params.specialite,
      specialiteNom:   specialite!.nom,
      parentId,
      jour,
      heure,
      genereParIA:     e.genereParIA,
      statut:          e.statut as 'EN_COURS' | 'TERMINEE' | 'REPORTEE',
      causeReport:     e.causeReport,
      dateProchainRdv: e.dateProchainRdv?.toISOString() ?? null,
      antecedents:     e.antecedents,
      signes:          e.signes,
      examens:         e.examens,
      bilan:           e.bilan,
      traitConseils:   e.traitConseils,
      traitInjections: e.traitInjections,
      traitOrdonnance: e.traitOrdonnance,
      suivi:           e.suivi,
      medecin:         e.medecin,
      centre:          e.centre,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documents:    e.documents.map((d: any) => ({ id: d.id, titre: d.titre, note: d.note, fichier: d.fichier, createdAt: d.createdAt.toISOString() })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ordonnances:  e.ordonnances.map((o: any) => ({ id: o.id, titre: o.titre, texte: o.texte, fichier: o.fichier, createdAt: o.createdAt.toISOString() })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sousConsultations: (e.sousConsultations ?? []).map((s: any) => mapEnr(s, e.id)),
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <Link
        href={moduleUrl}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux consultations
      </Link>

      {/* En-tête */}
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">
          Nouvelle sous-consultation
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
          {patient.nom.toUpperCase()} {patient.prenoms} — {specialite.nom}
        </p>
      </div>

      {/* Consultation parente + historique des sous-consultations */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
          <CornerDownRight className="h-3.5 w-3.5" />
          Consultation parente
        </p>
        <ConsultationCard enr={mapEnr(enr)} />
      </div>

      {/* Formulaire sous-consultation */}
      <Card className="overflow-hidden border-slate-200 dark:border-zinc-800 shadow-sm">
        <CardContent className="p-5">
          <FormWrapper
            dossierId={dossierId}
            specialiteId={params.specialite}
            specialiteNom={specialite.nom}
            parentId={enr.id}
            moduleUrl={moduleUrl}
          />
        </CardContent>
      </Card>

    </div>
  )
}
