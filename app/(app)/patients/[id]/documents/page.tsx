import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { ArrowLeft } from 'lucide-react'
import { SessionUser } from '@/types'
import { GestionDocumentsIdentification } from '@/components/patients/GestionDocumentsIdentification'

export default async function DocumentsIdentificationPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as unknown as SessionUser

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      dossier: {
        include: {
          accesEnCours: {
            where: { finAcces: { gt: new Date() } },
          },
        },
      },
    },
  })

  if (!patient) redirect('/patients')

  const accesActif = patient.dossier?.accesEnCours.find((a) => a.medecinId === user.id)
  const isAdmin = user.niveauAcces === 'SUPERADMIN' || user.niveauAcces === 'ADMIN_CENTRE'
  const accesValide = !!accesActif || isAdmin

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      <Link
        href={`/patients/${params.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au dossier
      </Link>

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Documents d&apos;identification</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
          {patient.nom.toUpperCase()} {patient.prenoms}
        </p>
      </div>

      <GestionDocumentsIdentification
        patientId={params.id}
        accesValide={accesValide}
      />

    </div>
  )
}
