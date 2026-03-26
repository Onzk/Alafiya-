import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { Plus, ArrowLeft, FileText, ScrollText, ExternalLink, Clock, CheckCircle2, CalendarX2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { FormulaireEnregistrement } from '@/components/dossier/FormulaireEnregistrement'
import { ConsultationCard } from '@/components/dossier/ConsultationCard'
import { RechercheInput } from './RechercheInput'
import { SessionUser } from '@/types'
import { ChatbotDossier } from '@/components/ia/ChatbotDossier'

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
  searchParams: { nouveau?: string; q?: string; tab?: string; statut?: string }
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
  const tab = searchParams.tab ?? 'consultations'
  const afficherFormulaire = searchParams.nouveau === '1'

  const VALID_STATUTS = ['EN_COURS', 'TERMINEE', 'REPORTEE'] as const
  type StatutFilter = typeof VALID_STATUTS[number]
  const statutFilter = VALID_STATUTS.includes(searchParams.statut as StatutFilter)
    ? (searchParams.statut as StatutFilter)
    : undefined

  const enrSelect = {
    medecin:    { select: { nom: true, prenoms: true, telephone: true, photo: true, role: { select: { nom: true } } } },
    centre:     { select: { nom: true, adresse: true, region: true, prefecture: true, type: true, telephone: true, email: true, logo: true } },
    documents:  { orderBy: { createdAt: 'asc' as const } },
    ordonnances:{ orderBy: { createdAt: 'asc' as const } },
  }

  const [enregistrements, docsModule, ordsModule] = await Promise.all([
    prisma.enregistrementMedical.findMany({
      where: {
        dossierId,
        specialiteId: params.specialite,
        parentId: null,
        ...(statutFilter && { statut: statutFilter }),
        ...(q && {
          OR: [
            { antecedents:     { contains: q, mode: 'insensitive' } },
            { signes:          { contains: q, mode: 'insensitive' } },
            { examens:         { contains: q, mode: 'insensitive' } },
            { bilan:           { contains: q, mode: 'insensitive' } },
            { traitConseils:   { contains: q, mode: 'insensitive' } },
            { traitInjections: { contains: q, mode: 'insensitive' } },
            { traitOrdonnance: { contains: q, mode: 'insensitive' } },
            { suivi:           { contains: q, mode: 'insensitive' } },
            { medecin: { nom:     { contains: q, mode: 'insensitive' } } },
            { medecin: { prenoms: { contains: q, mode: 'insensitive' } } },
          ],
        }),
      },
      include: {
        ...enrSelect,
        sousConsultations: {
          include: enrSelect,
          orderBy: { dateConsultation: 'asc' },
        },
      },
      orderBy: { dateConsultation: 'desc' },
    }),

    // Documents de toutes les consultations de ce module (sans filtre de recherche)
    prisma.documentConsultation.findMany({
      where: { enregistrement: { dossierId, specialiteId: params.specialite } },
      include: { enregistrement: { select: { dateConsultation: true } } },
      orderBy: { createdAt: 'desc' },
    }),

    // Ordonnances de toutes les consultations de ce module (sans filtre de recherche)
    prisma.ordonnanceConsultation.findMany({
      where: { enregistrement: { dossierId, specialiteId: params.specialite } },
      include: { enregistrement: { select: { dateConsultation: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const totalDocsModule = docsModule.length + ordsModule.length

  return (
    <div className="max-w-4xl mx-auto">
    <div className="space-y-6">

      <Link
        href={`/patients/${params.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
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

      {/* ── Formulaire nouvelle consultation ── */}
      {afficherFormulaire && (
        <FormulaireEnregistrement
          dossierId={dossierId}
          specialiteId={params.specialite}
          specialiteNom={specialite.nom}
        />
      )}

      {/* ── Tabs + contenu ── */}
      {!afficherFormulaire && (
        <>
          {/* Navigation tabs */}
          <div className="flex gap-0 border-b border-slate-200 dark:border-zinc-800">
            <Link
              href={`?tab=consultations${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab !== 'documents'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              Consultations
              <span className="ml-1.5 text-xs opacity-60">({enregistrements.length})</span>
            </Link>
            <Link
              href={`?tab=documents`}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                tab === 'documents'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              Documents
              {totalDocsModule > 0 && (
                <span className={`inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full text-[10px] font-bold ${
                  tab === 'documents'
                    ? 'bg-brand/10 text-brand'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                }`}>
                  {totalDocsModule}
                </span>
              )}
            </Link>
          </div>

          {/* ── Tab : Consultations ── */}
          {tab !== 'documents' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                  {enregistrements.length} consultation{enregistrements.length !== 1 ? 's' : ''}
                  {q && ` pour « ${q} »`}
                </p>
                <div className="sm:w-72">
                  <RechercheInput defaultValue={q} />
                </div>
              </div>

              {/* Filtre par statut */}
              <div className="flex gap-1.5 flex-wrap">
                {([
                  { value: undefined,   label: 'Tous',      Icon: null          },
                  { value: 'EN_COURS',  label: 'En cours',  Icon: Clock         },
                  { value: 'TERMINEE',  label: 'Terminées', Icon: CheckCircle2  },
                  { value: 'REPORTEE',  label: 'Reportées', Icon: CalendarX2    },
                ] as const).map(({ value, label, Icon }) => {
                  const isActive = statutFilter === value
                  const href = `?tab=consultations${value ? `&statut=${value}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`
                  return (
                    <Link
                      key={label}
                      href={href}
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                        isActive
                          ? 'bg-brand text-white border-brand'
                          : 'border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-950 hover:border-slate-300 dark:hover:border-zinc-600',
                      )}
                    >
                      {Icon && <Icon className="h-3 w-3" />}
                      {label}
                    </Link>
                  )
                })}
              </div>

              {enregistrements.length === 0 ? (
                <Card>
                  <CardContent className="p-10 text-center text-gray-400 dark:text-zinc-500">
                    {statutFilter
                      ? q
                        ? `Aucun résultat pour « ${q} » avec ce statut.`
                        : 'Aucune consultation avec ce statut.'
                      : q
                        ? `Aucun résultat pour « ${q} ».`
                        : 'Aucune consultation enregistrée dans cette spécialité.'}
                  </CardContent>
                </Card>
              ) : (
                enregistrements.map((enr) => {
                  const { jour, heure } = formatDate(enr.dateConsultation)
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  function mapEnr(e: any, parentId: string | null = null) {
                    const { jour: j, heure: h } = formatDate(e.dateConsultation)
                    return {
                      id:              e.id,
                      patientId:       params.id,
                      dossierId,
                      specialiteId:    params.specialite,
                      specialiteNom:   specialite!.nom,
                      parentId,
                      jour:            j,
                      heure:           h,
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
                      documents:       e.documents.map((d: any) => ({ id: d.id, titre: d.titre, note: d.note, fichier: d.fichier, createdAt: d.createdAt.toISOString() })),
                      ordonnances:     e.ordonnances.map((o: any) => ({ id: o.id, titre: o.titre, texte: o.texte, fichier: o.fichier, createdAt: o.createdAt.toISOString() })),
                      sousConsultations: (e.sousConsultations ?? []).map((s: any) => mapEnr(s, e.id)),
                    }
                  }
                  return (
                    <ConsultationCard
                      key={enr.id}
                      enr={mapEnr(enr)}
                    />
                  )
                })
              )}
            </div>
          )}

          {/* ── Tab : Documents de consultation ── */}
          {tab === 'documents' && (
            <div className="space-y-8">

              {/* Documents */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Documents ({docsModule.length})
                </p>
                {docsModule.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-8">
                    Aucun document associé aux consultations de cette spécialité.
                  </p>
                ) : (
                  docsModule.map((doc) => {
                    const { jour } = formatDate(doc.enregistrement.dateConsultation)
                    return (
                      <div
                        key={doc.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm"
                      >
                        <FileText className="h-4 w-4 text-slate-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-zinc-100 leading-tight">{doc.titre}</p>
                          {doc.note && (
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{doc.note}</p>
                          )}
                          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                            Consultation du {jour}
                          </p>
                        </div>
                        <a
                          href={doc.fichier}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 h-7 w-7 rounded flex items-center justify-center text-slate-400 hover:text-brand dark:text-zinc-500 dark:hover:text-brand transition-colors"
                          title="Ouvrir"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Ordonnances */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <ScrollText className="h-3.5 w-3.5" />
                  Ordonnances ({ordsModule.length})
                </p>
                {ordsModule.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-8">
                    Aucune ordonnance associée aux consultations de cette spécialité.
                  </p>
                ) : (
                  ordsModule.map((ord) => {
                    const { jour } = formatDate(ord.enregistrement.dateConsultation)
                    return (
                      <div
                        key={ord.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm"
                      >
                        <ScrollText className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          {ord.titre && (
                            <p className="text-sm font-medium text-slate-800 dark:text-zinc-100 leading-tight">{ord.titre}</p>
                          )}
                          {ord.texte && (
                            <p className="text-xs text-slate-600 dark:text-zinc-300 mt-0.5 leading-relaxed whitespace-pre-wrap">{ord.texte}</p>
                          )}
                          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                            Consultation du {jour}
                          </p>
                        </div>
                        {ord.fichier && (
                          <a
                            href={ord.fichier}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 h-7 w-7 rounded flex items-center justify-center text-slate-400 hover:text-brand dark:text-zinc-500 dark:hover:text-brand transition-colors"
                            title="Ouvrir le fichier"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

            </div>
          )}
        </>
      )}
    </div>

      {/* Chatbot overlay — FAB + panel latéral */}
      <ChatbotDossier
        patientId={params.id}
        patientNom={`${patient.nom.toUpperCase()} ${patient.prenoms}`}
        specialiteId={params.specialite}
        specialiteNom={specialite.nom}
      />
    </div>
  )
}
