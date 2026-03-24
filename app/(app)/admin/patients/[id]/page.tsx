import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import {
  User, Phone, Calendar, MapPin,
  Stethoscope, CheckCircle2, Clock, Activity,
} from 'lucide-react'
import { SessionUser } from '@/types'
import { calculerAge, formatDate, formatDateTime } from '@/lib/utils'

export default async function AdminPatientDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const user = session.user as unknown as SessionUser
  if (user.niveauAcces !== 'ADMIN_CENTRE') redirect('/dashboard')

  const centreId = user.centreActif
  if (!centreId) redirect('/admin/dashboard')

  const patient = await prisma.patient.findFirst({
    where: {
      id: params.id,
      OR: [
        { centreCreationId: centreId },
        { dossier: { enregistrements: { some: { centreId } } } },
      ],
    },
    include: {
      creePar: { select: { nom: true, prenoms: true } },
      centreCreation: { select: { nom: true } },
      dossier: {
        include: {
          enregistrements: {
            where: { centreId },
            include: {
              specialite: { select: { nom: true, code: true } },
              medecin: { select: { nom: true, prenoms: true } },
            },
            orderBy: { dateConsultation: 'desc' },
          },
        },
      },
    },
  })

  if (!patient) redirect('/admin/patients')

  const isLocal = patient.centreCreationId === centreId
  const consultations = patient.dossier?.enregistrements ?? []

  return (
    <div className="space-y-5 max-w-[900px]">

      {/* En-tête */}
      <div className="dash-in delay-0 flex items-center gap-3">

        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight truncate">
            {patient.nom.toUpperCase()} {patient.prenoms}
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Fiche patient · {consultations.length} consultation(s) dans ce centre
          </p>
        </div>
      </div>

      {/* Infos principales */}
      <div className="dash-in delay-75 grid sm:grid-cols-2 gap-4">

        {/* Identité */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
              <User className="h-4 w-4 text-brand" />
            </div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Identité</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
              <span className="text-brand font-extrabold text-lg">{patient.nom[0]}{patient.prenoms[0]}</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{patient.nom.toUpperCase()} {patient.prenoms}</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {patient.genre === 'M' ? 'Homme' : 'Femme'} · {calculerAge(patient.dateNaissance)} ans
                {patient.dateNaissancePresumee && ' (âge présumé)'}
              </p>
              <span className={`mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                isLocal
                  ? 'bg-brand/10 dark:bg-brand/15 text-brand'
                  : 'bg-blue-50 dark:bg-blue-400/15 text-blue-600 dark:text-blue-300'
              }`}>
                {isLocal ? 'Créé dans ce centre' : `Créé à : ${patient.centreCreation?.nom ?? 'Autre centre'}`}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <InfoRow icon={Calendar} label="Date de naissance" value={formatDate(patient.dateNaissance)} />
            {patient.adresse && <InfoRow icon={MapPin} label="Adresse" value={patient.adresse} />}
            {patient.telephone && <InfoRow icon={Phone} label="Téléphone" value={patient.telephone} />}
            {patient.numeroCNI && <InfoRow icon={User} label="N° CNI" value={patient.numeroCNI} />}
          </div>

          {patient.creePar && (
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 border-t border-slate-50 dark:border-zinc-800 pt-3">
              Enregistré par {patient.creePar.nom} {patient.creePar.prenoms}
            </p>
          )}
        </div>

        {/* Personne d'urgence */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-orange-100 dark:border-orange-400/20 p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-orange-50 dark:bg-orange-400/15 flex items-center justify-center">
              <Phone className="h-4 w-4 text-orange-500" />
            </div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Personne à prévenir</h2>
          </div>

          <div className="space-y-2.5">
            <InfoRow icon={User} label="Nom" value={`${patient.urgenceNom} ${patient.urgencePrenoms}`} />
            <InfoRow icon={User} label="Relation" value={patient.urgenceRelation} />
            <InfoRow icon={Phone} label="Téléphone" value={patient.urgenceTel} highlight />
            {patient.urgenceAdresse && (
              <InfoRow icon={MapPin} label="Adresse" value={patient.urgenceAdresse} />
            )}
          </div>
        </div>
      </div>

      {/* Consultations au centre */}
      <div className="dash-in delay-150 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-50 dark:border-zinc-800">
          <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-400/15 flex items-center justify-center">
            <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Consultations dans ce centre</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5">
              {consultations.length} consultation(s)
            </p>
          </div>
        </div>

        {consultations.length === 0 ? (
          <div className="py-12 text-center">
            <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-3">
              <Activity className="h-5 w-5 text-slate-300 dark:text-zinc-600" />
            </div>
            <p className="text-sm text-slate-400 dark:text-zinc-500">Aucune consultation enregistrée dans ce centre</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-5 py-2.5 bg-slate-50/60 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800">
              {['Date', 'Spécialité', 'Médecin', 'Statut'].map((h, i) => (
                <span key={i} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{h}</span>
              ))}
            </div>
            <ul>
              {consultations.map((c, i) => (
                <li
                  key={c.id}
                  className={`dash-in delay-${[0,75,100,150,200,225,300][Math.min(i,6)]} flex sm:grid sm:grid-cols-[1fr_1fr_1fr_auto] items-center gap-4 px-5 py-3.5 border-b border-slate-50 dark:border-zinc-800/60 last:border-0`}
                >
                  {/* Date */}
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {new Date(c.dateConsultation).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                      {new Date(c.dateConsultation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {/* Spécialité */}
                  <div>
                    <span className="text-xs bg-blue-50 dark:bg-blue-400/15 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-lg font-semibold">
                      {c.specialite?.nom ?? '—'}
                    </span>
                  </div>
                  {/* Médecin */}
                  <p className="text-xs text-slate-600 dark:text-zinc-300 truncate hidden sm:block">
                    {c.medecin ? `${c.medecin.nom} ${c.medecin.prenoms}` : '—'}
                  </p>
                  {/* Statut */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {c.valideParMedecin ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-brand bg-brand/8 dark:bg-brand/12 border border-brand/20 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Validé
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded-full">
                        <Clock className="h-2.5 w-2.5" /> En attente
                      </span>
                    )}
                    {c.genereParIA && (
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-400/15 border border-purple-200 dark:border-purple-400/20 px-1.5 py-0.5 rounded-full">
                        IA
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon, label, value, highlight,
}: {
  icon: React.ElementType
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-zinc-900/50 rounded-xl">
      <Icon className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{label}</p>
        <p className={`text-sm font-semibold truncate ${highlight ? 'text-orange-600 dark:text-orange-400' : 'text-slate-800 dark:text-zinc-200'}`}>
          {value}
        </p>
      </div>
    </div>
  )
}
