import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { Plus, ClipboardList, FlaskConical, Pill, CalendarCheck, ArrowLeft } from 'lucide-react'
import { ConsultationCardHeader } from './ConsultationCardHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FormulaireEnregistrement } from '@/components/dossier/FormulaireEnregistrement'
import { RechercheInput } from './RechercheInput'
import { SessionUser } from '@/types'

function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  const jour  = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return { jour: jour.charAt(0).toUpperCase() + jour.slice(1), heure }
}

export default async function ModuleSpecialitePage({
  params,
  searchParams,
}: {
  params: { id: string; specialite: string }
  searchParams: { nouveau?: string; q?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as unknown as SessionUser

  const [patient, specialite] = await Promise.all([
    prisma.patient.findUnique({
      where: { id: params.id },
      select: { nom: true, prenoms: true, dossier: { select: { id: true } } },
    }),
    prisma.specialite.findUnique({ where: { id: params.specialite } }),
  ])

  if (!patient || !specialite || !patient.dossier) redirect('/patients')

  const dossierId = patient.dossier.id

  const accesValide =
    user.niveauAcces === 'SUPERADMIN' ||
    !!(await prisma.accesDossier.findFirst({
      where: { dossierId, medecinId: user.id, finAcces: { gt: new Date() } },
    }))

  if (!accesValide) redirect('/scanner')

  const q = searchParams.q?.trim() ?? ''

  const enregistrements = await prisma.enregistrementMedical.findMany({
    where: {
      dossierId,
      specialiteId: params.specialite,
      ...(q && {
        OR: [
          { antecedents:    { contains: q, mode: 'insensitive' } },
          { signes:         { contains: q, mode: 'insensitive' } },
          { examens:        { contains: q, mode: 'insensitive' } },
          { bilan:          { contains: q, mode: 'insensitive' } },
          { traitConseils:  { contains: q, mode: 'insensitive' } },
          { traitInjections:{ contains: q, mode: 'insensitive' } },
          { traitOrdonnance:{ contains: q, mode: 'insensitive' } },
          { suivi:          { contains: q, mode: 'insensitive' } },
          { medecin: { nom:     { contains: q, mode: 'insensitive' } } },
          { medecin: { prenoms: { contains: q, mode: 'insensitive' } } },
        ],
      }),
    },
    include: {
      medecin: { select: { nom: true, prenoms: true, telephone: true, photo: true, role: { select: { nom: true } } } },
      centre:  { select: { nom: true, adresse: true, region: true, prefecture: true, type: true, telephone: true, email: true, logo: true } },
    },
    orderBy: { dateConsultation: 'desc' },
  })

  const afficherFormulaire = searchParams.nouveau === '1'

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <Link href={`/patients/${params.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Retour au dossier
      </Link>

      {/* ── En-tête ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">
            {specialite.nom}
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
            {patient.nom.toUpperCase()} {patient.prenoms}
          </p>
        </div>
        {!afficherFormulaire && (
          <Link href="?nouveau=1" className="sm:shrink-0">
            <Button className="w-full sm:w-auto h-10">
              <Plus className="mr-1.5 h-4 w-4" />
              Nouvelle consultation
            </Button>
          </Link>
        )}
      </div>

      {/* ── Formulaire ── */}
      {afficherFormulaire && (
        <FormulaireEnregistrement
          dossierId={dossierId}
          specialiteId={params.specialite}
          specialiteNom={specialite.nom}
        />
      )}

      {/* ── Historique ── */}
      {!afficherFormulaire && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
              {enregistrements.length} consultation{enregistrements.length !== 1 ? 's' : ''}{q && ` pour « ${q} »`}
            </p>
            <div className="sm:w-72">
              <RechercheInput defaultValue={q} />
            </div>
          </div>

          {enregistrements.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-gray-400 dark:text-zinc-500">
                {q ? `Aucun résultat pour « ${q} ».` : 'Aucune consultation enregistrée dans cette spécialité.'}
              </CardContent>
            </Card>
          ) : (
            enregistrements.map((enr) => (
              <Card key={enr.id} className="overflow-hidden border-slate-200 dark:border-zinc-800 shadow-sm">

                {/* Header de la card */}
                {(() => {
                  const { jour, heure } = formatDate(enr.dateConsultation)
                  return (
                    <ConsultationCardHeader
                      jour={jour}
                      heure={heure}
                      genereParIA={enr.genereParIA}
                      medecin={enr.medecin}
                      centre={enr.centre}
                    />
                  )
                })()}

                {/* Corps */}
                <CardContent className="p-4 grid gap-4 sm:grid-cols-2">
                  {enr.antecedents && (
                    <Section icon={ClipboardList} color="blue" label="Antécédents" value={enr.antecedents} />
                  )}
                  {enr.signes && (
                    <Section icon={ClipboardList} color="blue" label="Signes & Symptômes" value={enr.signes} />
                  )}
                  {enr.examens && (
                    <Section icon={FlaskConical} color="violet" label="Examens" value={enr.examens} />
                  )}
                  {enr.bilan && (
                    <Section icon={FlaskConical} color="violet" label="Bilan" value={enr.bilan} />
                  )}
                  {enr.traitConseils && (
                    <Section icon={Pill} color="emerald" label="Conseils" value={enr.traitConseils} />
                  )}
                  {enr.traitInjections && (
                    <Section icon={Pill} color="emerald" label="Injections" value={enr.traitInjections} />
                  )}
                  {enr.traitOrdonnance && (
                    <Section icon={Pill} color="emerald" label="Ordonnance" value={enr.traitOrdonnance} className="sm:col-span-2" />
                  )}
                  {enr.suivi && (
                    <Section icon={CalendarCheck} color="orange" label="Suivi" value={enr.suivi} className="sm:col-span-2" />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}

/* ── Composants internes ── */

const COLORS = {
  blue:    { icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400',    label: 'text-blue-600 dark:text-blue-400'    },
  violet:  { icon: 'bg-violet-100 dark:bg-violet-900/30 text-violet-500 dark:text-violet-400', label: 'text-violet-600 dark:text-violet-400' },
  emerald: { icon: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400', label: 'text-emerald-600 dark:text-emerald-400' },
  orange:  { icon: 'bg-orange-100 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400',  label: 'text-orange-600 dark:text-orange-400'  },
}

function Section({
  icon: Icon, color, label, value, className = '',
}: {
  icon: React.ComponentType<{ className?: string }>
  color: keyof typeof COLORS
  label: string
  value: string
  className?: string
}) {
  const c = COLORS[color]
  const lines = value.split('\n').filter((l) => l.trim() !== '')

  return (
    <div className={className}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`inline-flex items-center justify-center h-5 w-5 rounded-md ${c.icon}`}>
          <Icon className="h-3 w-3" />
        </span>
        <span className={`text-xs font-semibold uppercase tracking-wide ${c.label}`}>{label}</span>
      </div>
      {lines.length <= 1 ? (
        <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">{value}</p>
      ) : (
        <ul className="space-y-1">
          {lines.map((line, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-zinc-300">
              <span className="text-slate-300 dark:text-zinc-600 shrink-0 mt-0.5">•</span>
              <span className="leading-relaxed">{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
