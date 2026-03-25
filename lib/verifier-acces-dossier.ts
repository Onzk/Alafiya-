import prisma from '@/lib/db'

/**
 * Vérifie si un utilisateur a le droit d'accéder/modifier le dossier d'un patient.
 * Les admins (SUPERADMIN, ADMIN_CENTRE) ont toujours accès.
 * Le personnel doit avoir un AccesDossier actif.
 */
export async function verifierAccesDossier(
  patientId: string,
  userId: string,
  niveauAcces: string,
): Promise<boolean> {
  if (niveauAcces === 'SUPERADMIN' || niveauAcces === 'ADMIN_CENTRE') return true

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { dossier: { select: { id: true } } },
  })
  if (!patient?.dossier) return false

  const acces = await prisma.accesDossier.findFirst({
    where: {
      dossierId: patient.dossier.id,
      medecinId: userId,
      finAcces: { gt: new Date() },
    },
  })
  return !!acces
}
