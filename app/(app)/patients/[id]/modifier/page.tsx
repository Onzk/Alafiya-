import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'
import { FormulaireModificationPatient } from './FormulaireModification'

export default async function ModifierPatientPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as unknown as SessionUser

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: { personnesUrgence: true, dossier: { select: { id: true } } },
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
        personnesUrgence: patient.personnesUrgence.map((p) => ({
          nom: p.nom,
          prenoms: p.prenoms,
          telephone: p.telephone,
          adresse: p.adresse,
          relation: p.relation,
        })),
      }}
    />
  )
}
