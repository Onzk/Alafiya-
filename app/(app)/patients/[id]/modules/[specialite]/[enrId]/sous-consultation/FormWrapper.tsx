'use client'

import { useRouter } from 'next/navigation'
import { FormulaireEnregistrement } from '@/components/dossier/FormulaireEnregistrement'

interface Props {
  dossierId: string
  specialiteId: string
  specialiteNom: string
  parentId: string
  moduleUrl: string
}

export function FormWrapper({ dossierId, specialiteId, specialiteNom, parentId, moduleUrl }: Props) {
  const router = useRouter()
  return (
    <FormulaireEnregistrement
      dossierId={dossierId}
      specialiteId={specialiteId}
      specialiteNom={specialiteNom}
      parentId={parentId}
      onCancel={() => router.push(moduleUrl)}
      onSuccess={() => router.push(moduleUrl)}
    />
  )
}
