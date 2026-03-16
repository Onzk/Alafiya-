import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { Users, UserPlus, Settings, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SessionUser } from '@/types'

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as unknown as SessionUser
  if (!['MINISTERE', 'ADMIN_CENTRE'].includes(user.niveauAcces)) redirect('/dashboard')

  const centreId = user.centreActif
  if (!centreId) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Aucun centre actif sélectionné.</p>
      </div>
    )
  }

  const [centre, totalPersonnel, personnelActif, totalPatients] = await Promise.all([
    prisma.centre.findUnique({ where: { id: centreId }, select: { nom: true } }),
    prisma.user.count({ where: { centres: { some: { centreId } }, niveauAcces: 'PERSONNEL' } }),
    prisma.user.count({ where: { centres: { some: { centreId } }, niveauAcces: 'PERSONNEL', estActif: true } }),
    prisma.patient.count({ where: { centreCreationId: centreId } }),
  ])

  const dernierPersonnel = await prisma.user.findMany({
    where: { centres: { some: { centreId } }, niveauAcces: 'PERSONNEL' },
    select: { id: true, nom: true, prenoms: true, email: true, estActif: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{centre?.nom ?? 'Centre de santé'}</h1>
        <p className="text-gray-500 text-sm mt-1">Tableau de bord administrateur</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { label: 'Personnel actif', value: personnelActif, total: totalPersonnel, color: 'text-green-600', bg: 'bg-green-50', icon: Users },
          { label: 'Patients du centre', value: totalPatients, color: 'text-blue-600', bg: 'bg-blue-50', icon: Activity },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                  {'total' in stat && stat.total !== stat.value && (
                    <p className="text-xs text-gray-400">{stat.total} au total</p>
                  )}
                </div>
                <div className={`h-12 w-12 rounded-full ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/admin/personnels">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Gérer le personnel</p>
                <p className="text-xs text-gray-400">Créer et gérer les comptes</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/roles">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Rôles du centre</p>
                <p className="text-xs text-gray-400">Définir les accès locaux</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Personnel médical</CardTitle>
          <Link href="/admin/personnels">
            <Button size="sm"><UserPlus className="mr-1 h-4 w-4" />Ajouter</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {dernierPersonnel.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Aucun personnel enregistré</p>
          ) : (
            <div className="space-y-3">
              {dernierPersonnel.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-700 text-xs font-semibold">{p.nom[0]}{p.prenoms[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{p.nom} {p.prenoms}</p>
                      <p className="text-xs text-gray-400">{p.email}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.estActif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.estActif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
