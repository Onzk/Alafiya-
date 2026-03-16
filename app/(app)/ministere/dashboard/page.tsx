import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { Building2, Users, FileText, Activity, Plus, Settings, Stethoscope } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SessionUser } from '@/types'

export default async function MinistereDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as unknown as SessionUser
  if (user.niveauAcces !== 'MINISTERE') redirect('/dashboard')

  const [totalCentres, centresActifs, totalPatients, totalConsultations, totalPersonnel] =
    await Promise.all([
      prisma.centre.count(),
      prisma.centre.count({ where: { estActif: true } }),
      prisma.patient.count(),
      prisma.enregistrementMedical.count(),
      prisma.user.count({ where: { niveauAcces: 'PERSONNEL' } }),
    ])

  const derniersCentres = await prisma.centre.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { admin: { select: { nom: true, prenoms: true } } },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord national</h1>
        <p className="text-gray-500 text-sm mt-1">Ministère de la Santé du Togo</p>
      </div>

      {/* Statistiques */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Centres actifs', value: centresActifs, total: totalCentres, icon: Building2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Patients enregistrés', value: totalPatients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Consultations', value: totalConsultations, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Personnel médical', value: totalPersonnel, icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
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

      {/* Actions rapides */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: '/ministere/centres', icon: Building2, label: 'Gérer les centres', sub: 'Créer, activer, désactiver', border: 'border-green-100', bg: 'bg-green-100', color: 'text-green-600' },
          { href: '/ministere/roles', icon: Settings, label: 'Rôles & Permissions', sub: 'Définir les accès globaux', border: 'border-blue-100', bg: 'bg-blue-100', color: 'text-blue-600' },
          { href: '/ministere/specialites', icon: Stethoscope, label: 'Spécialités', sub: 'Gérer les spécialités médicales', border: 'border-purple-100', bg: 'bg-purple-100', color: 'text-purple-600' },
        ].map(({ href, icon: Icon, label, sub, border, bg, color }) => (
          <Link key={href} href={href}>
            <Card className={`hover:shadow-md transition-shadow cursor-pointer ${border}`}>
              <CardContent className="p-5 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Derniers centres */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Derniers centres enregistrés</CardTitle>
          <Link href="/ministere/centres">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Nouveau centre
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {derniersCentres.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Aucun centre enregistré</p>
          ) : (
            <div className="space-y-3">
              {derniersCentres.map((centre) => (
                <div key={centre.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{centre.nom}</p>
                    <p className="text-xs text-gray-400">{centre.type} • {centre.region}</p>
                    {centre.admin && (
                      <p className="text-xs text-gray-400">Admin : {centre.admin.nom} {centre.admin.prenoms}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${centre.estActif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {centre.estActif ? 'Actif' : 'Inactif'}
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
