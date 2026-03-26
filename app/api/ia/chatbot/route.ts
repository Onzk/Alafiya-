import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { chatIA, MessageChat } from '@/lib/ollama'

export const maxDuration = 120 // 2 min — llama3.2:3b peut être lent

function calculerAge(dateNaissance: Date): number {
  const aujourd = new Date()
  let age = aujourd.getFullYear() - dateNaissance.getFullYear()
  const mois = aujourd.getMonth() - dateNaissance.getMonth()
  if (mois < 0 || (mois === 0 && aujourd.getDate() < dateNaissance.getDate())) age--
  return age
}

type EnrData = {
  dateConsultation: Date
  antecedents: string | null
  signes: string | null
  examens: string | null
  bilan: string | null
  traitConseils: string | null
  traitInjections: string | null
  traitOrdonnance: string | null
  suivi: string | null
  statut: string
  specialite?: { nom: string } | null
  medecin?: { nom: string; prenoms: string } | null
  sousConsultations?: EnrData[]
}

function formaterEnr(enr: EnrData, indent = ''): string {
  const date = enr.dateConsultation.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  let txt = `\n${indent}— ${date}`
  if (enr.specialite?.nom) txt += ` · ${enr.specialite.nom}`
  if (enr.medecin) txt += ` · Dr ${enr.medecin.nom} ${enr.medecin.prenoms}`
  txt += ` · Statut: ${enr.statut}\n`
  if (enr.antecedents)     txt += `${indent}  Antécédents: ${enr.antecedents}\n`
  if (enr.signes)          txt += `${indent}  Signes/Symptômes: ${enr.signes}\n`
  if (enr.examens)         txt += `${indent}  Examens: ${enr.examens}\n`
  if (enr.bilan)           txt += `${indent}  Bilan: ${enr.bilan}\n`
  if (enr.traitConseils)   txt += `${indent}  Conseils: ${enr.traitConseils}\n`
  if (enr.traitInjections) txt += `${indent}  Injections: ${enr.traitInjections}\n`
  if (enr.traitOrdonnance) txt += `${indent}  Ordonnance: ${enr.traitOrdonnance}\n`
  if (enr.suivi)           txt += `${indent}  Suivi: ${enr.suivi}\n`
  if (enr.sousConsultations?.length) {
    txt += `${indent}  Sous-consultations (${enr.sousConsultations.length}) :\n`
    for (const sc of enr.sousConsultations) {
      txt += formaterEnr(sc, indent + '    ')
    }
  }
  return txt
}

function construireContexte(
  patient: { nom: string; prenoms: string; genre: string; dateNaissance: Date; adresse: string },
  enregistrements: EnrData[],
  specialiteNom?: string,
): string {
  const age = calculerAge(patient.dateNaissance)

  let ctx = `Tu es un assistant médical IA intégré dans Alafiya Plus, système de dossiers médicaux du Togo.
Tu aides le personnel médical à consulter et comprendre le dossier du patient.
Réponds toujours en français. Sois concis et professionnel.
Ne pose jamais de diagnostic, ne prescris rien. Tu résumes et réponds uniquement sur la base des données du dossier.

=== PATIENT ===
Nom : ${patient.nom.toUpperCase()} ${patient.prenoms}
Genre : ${patient.genre === 'M' ? 'Masculin' : 'Féminin'} | Âge : ${age} ans
Adresse : ${patient.adresse}
`

  if (specialiteNom) ctx += `Module actif : ${specialiteNom}\n`

  if (enregistrements.length === 0) {
    ctx += '\nAucune consultation enregistrée.\n'
    return ctx
  }

  ctx += `\n=== CONSULTATIONS (${enregistrements.length}) ===`
  for (const enr of enregistrements) {
    ctx += formaterEnr(enr)
  }

  return ctx
}

const enrSelect = {
  dateConsultation: true,
  antecedents: true, signes: true, examens: true, bilan: true,
  traitConseils: true, traitInjections: true, traitOrdonnance: true,
  suivi: true, statut: true,
  specialite: { select: { nom: true } },
  medecin: { select: { nom: true, prenoms: true } },
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const body = await req.json()
    const { message, patientId, specialiteId, historique = [] } = body

    if (!message?.trim() || !patientId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        nom: true, prenoms: true, genre: true, dateNaissance: true, adresse: true,
        dossier: { select: { id: true } },
      },
    })

    if (!patient?.dossier) {
      return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 })
    }

    const [enregistrements, specialite] = await Promise.all([
      prisma.enregistrementMedical.findMany({
        where: {
          dossierId: patient.dossier.id,
          parentId: null,
          ...(specialiteId ? { specialiteId } : {}),
        },
        select: {
          ...enrSelect,
          sousConsultations: {
            select: {
              ...enrSelect,
              sousConsultations: { select: enrSelect, orderBy: { dateConsultation: 'asc' } },
            },
            orderBy: { dateConsultation: 'asc' },
          },
        },
        orderBy: { dateConsultation: 'desc' },
        take: 20,
      }),
      specialiteId
        ? prisma.specialite.findUnique({ where: { id: specialiteId }, select: { nom: true } })
        : null,
    ])

    const systemPrompt = construireContexte(patient, enregistrements, specialite?.nom)

    const messages: MessageChat[] = [
      { role: 'system', content: systemPrompt },
      ...(historique as MessageChat[]).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ]

    const reponse = await chatIA(messages)
    return NextResponse.json({ reponse })
  } catch (err) {
    console.error('[Chatbot IA]', err)
    return NextResponse.json(
      { error: 'Erreur IA. Vérifiez que Ollama est démarré avec le modèle llama3.2:3b.' },
      { status: 500 },
    )
  }
}
