import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { QrCode, UserPlus, FileText, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import { SessionUser } from '@/types'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as unknown as SessionUser

  if (user.niveauAcces === 'MINISTERE') redirect('/ministere/dashboard')
  if (user.niveauAcces === 'ADMIN_CENTRE') redirect('/admin/dashboard')

  const [totalPatients, derniersEnregistrements] = await Promise.all([
    prisma.patient.count({ where: { creeParId: user.id } }),
    prisma.enregistrementMedical.findMany({
      where: { medecinId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { specialite: { select: { nom: true } } },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {user.prenoms} {user.nom}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Tableau de bord — Personnel médical</p>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: '/scanner', icon: QrCode, label: 'Scanner QR', color: 'bg-green-100 text-green-600' },
          { href: '/patients/nouveau', icon: UserPlus, label: 'Nouveau patient', color: 'bg-blue-100 text-blue-600' },
          { href: '/patients', icon: FileText, label: 'Mes patients', color: 'bg-purple-100 text-purple-600' },
          { href: '/urgence', icon: Clock, label: 'Urgence', color: 'bg-red-100 text-red-600', border: 'border-red-100' },
        ].map(({ href, icon: Icon, label, color, border }) => (
          <Link key={href} href={href}>
            <Card className={`hover:shadow-md transition-all cursor-pointer ${border || ''}`}>
              <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                <div className={`h-12 w-12 rounded-full ${color} flex items-center justify-center`}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="font-medium text-sm text-gray-900">{label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Statistiques */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Patients créés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{totalPatients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Spécialités assignées</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{user.specialites?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Dernières consultations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dernières consultations</CardTitle>
        </CardHeader>
        <CardContent>
          {derniersEnregistrements.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Aucune consultation récente</p>
          ) : (
            <div className="space-y-3">
              {derniersEnregistrements.map((enr) => (
                <div key={enr.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{enr.specialite.nom}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(enr.dateConsultation)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
