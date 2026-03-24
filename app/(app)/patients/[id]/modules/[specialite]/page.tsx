import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FormulaireEnregistrement } from '@/components/dossier/FormulaireEnregistrement'
import { formatDateTime } from '@/lib/utils'
import { SessionUser } from '@/types'

export default async function ModuleSpecialitePage({
  params,
  searchParams,
}: {
  params: { id: string; specialite: string }
  searchParams: { nouveau?: string }
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

  // Vérifier accès valide
  const accesValide =
    user.niveauAcces === 'SUPERADMIN' ||
    !!(await prisma.accesDossier.findFirst({
      where: { dossierId, medecinId: user.id, finAcces: { gt: new Date() } },
    }))

  if (!accesValide) redirect('/scanner')

  const enregistrements = await prisma.enregistrementMedical.findMany({
    where: { dossierId, specialiteId: params.specialite },
    include: {
      medecin: { select: { nom: true, prenoms: true } },
      centre: { select: { nom: true } },
    },
    orderBy: { dateConsultation: 'desc' },
  })

  const afficherFormulaire = searchParams.nouveau === '1'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{specialite.nom}</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400">{patient.nom.toUpperCase()} {patient.prenoms}</p>
          </div>
        </div>
        {!afficherFormulaire && (
          <Link href="?nouveau=1">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Nouvelle consultation
            </Button>
          </Link>
        )}
      </div>

      {afficherFormulaire && (
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <FormulaireEnregistrement
              dossierId={dossierId}
              specialiteId={params.specialite}
              specialiteNom={specialite.nom}
            />
          </CardContent>
        </Card>
      )}

      {!afficherFormulaire && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-700 dark:text-zinc-300">
            Historique des consultations ({enregistrements.length})
          </h2>

        {enregistrements.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-400 dark:text-zinc-500">
              Aucune consultation dans cette spécialité.
            </CardContent>
          </Card>
        ) : (
          enregistrements.map((enr) => (
            <Card key={enr.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-gray-700 dark:text-zinc-300">
                    {formatDateTime(enr.dateConsultation)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {enr.genereParIA && <Badge variant="secondary" className="text-xs">IA</Badge>}
                    <span className="text-xs text-gray-400 dark:text-zinc-500">
                      Dr {enr.medecin.nom} {enr.medecin.prenoms}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {enr.antecedents && (
                  <div>
                    <p className="font-medium text-gray-500 dark:text-zinc-400 text-xs uppercase tracking-wide">Antécédents</p>
                    <p className="text-gray-800 dark:text-zinc-200 mt-1">{enr.antecedents}</p>
                  </div>
                )}
                {enr.signes && (
                  <div>
                    <p className="font-medium text-gray-500 dark:text-zinc-400 text-xs uppercase tracking-wide">Signes & Symptômes</p>
                    <p className="text-gray-800 dark:text-zinc-200 mt-1">{enr.signes}</p>
                  </div>
                )}
                {enr.examens && (
                  <div>
                    <p className="font-medium text-gray-500 dark:text-zinc-400 text-xs uppercase tracking-wide">Examens</p>
                    <p className="text-gray-800 dark:text-zinc-200 mt-1">{enr.examens}</p>
                  </div>
                )}
                {enr.bilan && (
                  <div>
                    <p className="font-medium text-gray-500 dark:text-zinc-400 text-xs uppercase tracking-wide">Bilan</p>
                    <p className="text-gray-800 dark:text-zinc-200 mt-1">{enr.bilan}</p>
                  </div>
                )}
                {(enr.traitConseils || enr.traitInjections || enr.traitOrdonnance) && (
                  <div>
                    <p className="font-medium text-gray-500 dark:text-zinc-400 text-xs uppercase tracking-wide">Traitements</p>
                    {enr.traitConseils && <p className="mt-1"><span className="text-xs text-gray-400 dark:text-zinc-500">Conseils : </span>{enr.traitConseils}</p>}
                    {enr.traitInjections && <p className="mt-1"><span className="text-xs text-gray-400 dark:text-zinc-500">Injections : </span>{enr.traitInjections}</p>}
                    {enr.traitOrdonnance && <p className="mt-1"><span className="text-xs text-gray-400 dark:text-zinc-500">Ordonnance : </span>{enr.traitOrdonnance}</p>}
                  </div>
                )}
                {enr.suivi && (
                  <div>
                    <p className="font-medium text-gray-500 dark:text-zinc-400 text-xs uppercase tracking-wide">Suivi</p>
                    <p className="text-gray-800 dark:text-zinc-200 mt-1">{enr.suivi}</p>
                  </div>
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
