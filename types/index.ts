import { NiveauAcces } from '@prisma/client'

export type { NiveauAcces }

// Session NextAuth étendue
export interface SessionUser {
  id?: string
  nom: string
  prenoms: string
  email?: string | null
  niveauAcces: NiveauAcces
  centreActif?: string
  centres: string[]
  specialites: string[]
  permissions: string[]
}

// Formulaire structuré IA
export interface StructureIA {
  antecedents?: string
  signes?: string
  examens?: string
  bilan?: string
  traitements?: {
    conseils?: string
    injections?: string
    ordonnance?: string
  }
  suivi?: string
}
