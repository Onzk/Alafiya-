import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { UserPlus, QrCode, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { calculerAge } from '@/lib/utils'

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const page = parseInt(searchParams.page || '1')
  const limit = 20
  const skip = (page - 1) * limit

  const where = searchParams.q
    ? {
        OR: [
          { nom: { contains: searchParams.q, mode: 'insensitive' as const } },
          { prenoms: { contains: searchParams.q, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.patient.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-500 text-sm mt-1">{total} patient(s)</p>
        </div>
        <Link href="/patients/nouveau">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Nouveau patient
          </Button>
        </Link>
      </div>

      {/* Recherche */}
      <form method="get" className="relative">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Rechercher par nom ou prénom..."
          className="w-full pl-4 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </form>

      {patients.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Aucun patient trouvé</p>
          {searchParams.q && (
            <Link href="/patients" className="text-green-600 text-sm mt-2 inline-block hover:underline">
              Effacer la recherche
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-700 font-semibold text-sm">
                        {patient.nom[0]}{patient.prenoms[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {patient.nom.toUpperCase()} {patient.prenoms}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {patient.genre === 'M' ? 'Homme' : 'Femme'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {calculerAge(patient.dateNaissance)} ans
                          {patient.dateNaissancePresumee && ' (présumé)'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/patients/${patient.id}/qrcode`}>
                      <Button size="sm" variant="outline">
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/patients/${patient.id}`}>
                      <Button size="sm">Dossier</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/patients?page=${p}${searchParams.q ? `&q=${searchParams.q}` : ''}`}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                p === page ? 'bg-green-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
