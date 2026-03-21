import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import {
  ArrowLeft, Mail, Phone, UserCheck, UserX,
  Stethoscope, Shield, Users, Pencil, UserRound, Calendar,
} from 'lucide-react'
import { SessionUser } from '@/types'
import { formatDate } from '@/lib/utils'
import { PersonnelActions } from './PersonnelActions'

export default async function PersonnelDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const user = session.user as unknown as SessionUser
  if (user.niveauAcces !== 'ADMIN_CENTRE') redirect('/dashboard')

  const centreId = user.centreActif
  if (!centreId) redirect('/admin/dashboard')

  const personnel = await prisma.user.findFirst({
    where: {
      id: params.id,
      centres: { some: { centreId } },
      niveauAcces: 'PERSONNEL',
    },
    select: {
      id: true, nom: true, prenoms: true, email: true,
      telephone: true, estActif: true, createdAt: true, photo: true,
      role:          { select: { nom: true } },
      typePersonnel: { select: { nom: true, code: true } },
      specialites:   { include: { specialite: { select: { nom: true, code: true } } } },
      _count:        { select: { enregistrements: true, patientsCrees: true } },
      patientsCrees: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, nom: true, prenoms: true, createdAt: true },
      },
    },
  })

  if (!personnel) redirect('/admin/personnels')

  return (
    <div className="space-y-5 max-w-[900px]">

      {/* En-tête */}
      <div className="dash-in delay-0 flex items-center gap-3">
        <Link
          href="/admin/personnels"
          className="h-9 w-9 rounded-xl border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight truncate">
            {personnel.nom.toUpperCase()} {personnel.prenoms}
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Fiche personnel · {personnel.typePersonnel?.nom ?? 'Personnel médical'}
          </p>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <PersonnelActions
            id={personnel.id}
            nom={personnel.nom}
            prenoms={personnel.prenoms}
            estActif={personnel.estActif}
          />
          <Link
            href={`/admin/personnels/${personnel.id}/modifier`}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-semibold shadow-sm shadow-brand/20 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </Link>
        </div>
      </div>

      {/* Grille principale */}
      <div className="dash-in delay-75 grid sm:grid-cols-2 gap-4">

        {/* Identité */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
              <Users className="h-4 w-4 text-brand" />
            </div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Identité</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
              <span className="text-brand font-extrabold text-lg">
                {personnel.nom[0]}{personnel.prenoms[0]}
              </span>
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                {personnel.nom.toUpperCase()} {personnel.prenoms}
              </p>
              <div className={`mt-1 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                personnel.estActif
                  ? 'bg-brand/8 dark:bg-brand/12 border-brand/20 text-brand'
                  : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'
              }`}>
                {personnel.estActif
                  ? <><UserCheck className="h-2.5 w-2.5" />Actif</>
                  : <><UserX className="h-2.5 w-2.5" />Inactif</>
                }
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <InfoRow icon={Mail}     label="Email"     value={personnel.email} />
            {personnel.telephone && (
              <InfoRow icon={Phone} label="Téléphone" value={personnel.telephone} />
            )}
            <InfoRow icon={Calendar} label="Membre depuis" value={formatDate(personnel.createdAt)} />
          </div>
        </div>

        {/* Profil */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-400/15 flex items-center justify-center">
              <Shield className="h-4 w-4 text-purple-600 dark:text-purple-300" />
            </div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Profil</h2>
          </div>

          <div className="space-y-3">
            {personnel.typePersonnel ? (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1.5">
                  Type de personnel
                </p>
                <span className="text-xs bg-purple-50 dark:bg-purple-400/15 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-xl font-semibold">
                  {personnel.typePersonnel.nom}
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-zinc-500">Aucun type assigné</p>
            )}

            {personnel.specialites.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1.5">
                  Spécialités
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {personnel.specialites.map((s) => (
                    <span
                      key={s.specialite.code}
                      className="text-xs bg-blue-50 dark:bg-blue-400/15 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-xl font-semibold"
                    >
                      {s.specialite.nom}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {personnel._count.enregistrements}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mt-0.5">
                Consultations
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {personnel._count.patientsCrees}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mt-0.5">
                Patients créés
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Derniers patients créés */}
      {personnel.patientsCrees.length > 0 && (
        <div className="dash-in delay-150 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-50 dark:border-zinc-800">
            <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-400/15 flex items-center justify-center">
              <UserRound className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Derniers patients enregistrés</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5">
                5 plus récents sur {personnel._count.patientsCrees}
              </p>
            </div>
          </div>
          <ul>
            {personnel.patientsCrees.map((p, i) => (
              <li
                key={p.id}
                className={`dash-in delay-${[0,75,100,150,200][i]} flex items-center justify-between gap-4 px-5 py-3 border-b border-slate-50 dark:border-zinc-800/60 last:border-0`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand font-bold text-xs">{p.nom[0]}{p.prenoms[0]}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate">
                    {p.nom.toUpperCase()} {p.prenoms}
                  </p>
                </div>
                <p className="text-xs text-slate-400 dark:text-zinc-500 flex-shrink-0">
                  {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-zinc-900/50 rounded-xl">
      <Icon className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{label}</p>
        <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate">{value}</p>
      </div>
    </div>
  )
}
