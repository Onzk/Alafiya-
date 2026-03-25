import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'
import { FormulaireModificationPatient } from './FormulaireModification'

export default async function ModifierPatientPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as unknown as SessionUser

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    select: {
      nom: true, prenoms: true, genre: true, dateNaissance: true,
      dateNaissancePresumee: true, adresse: true, telephone: true,
      email: true, numeroCNI: true, photo: true,
      personnesUrgence: true,
      dossier: { select: { id: true } },
    },
  })

  if (!patient || !patient.dossier) redirect('/patients')

  // Access control: SUPERADMIN or valid QR scan
  const accesValide =
    user.niveauAcces === 'SUPERADMIN' ||
    !!(await prisma.accesDossier.findFirst({
      where: { dossierId: patient.dossier.id, medecinId: user.id, finAcces: { gt: new Date() } },
    }))

  if (!accesValide) redirect(`/patients/${params.id}`)

  return (
    <div className="space-y-5">
      <Link href={`/patients/${params.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Retour au dossier
      </Link>
      <FormulaireModificationPatient
      patientId={params.id}
      initialData={{
        nom: patient.nom,
        prenoms: patient.prenoms,
        genre: patient.genre,
        dateNaissance: patient.dateNaissance.toISOString().split('T')[0],
        dateNaissancePresumee: patient.dateNaissancePresumee,
        adresse: patient.adresse,
        telephone: patient.telephone ?? '',
        email: patient.email ?? '',
        numeroCNI: patient.numeroCNI ?? '',
        photo: patient.photo ?? null,
        personnesUrgence: patient.personnesUrgence.map((p) => ({
          nom: p.nom,
          prenoms: p.prenoms,
          telephone: p.telephone,
          adresse: p.adresse,
          relation: p.relation,
        })),
      }}
    />
    </div>
  )
}
