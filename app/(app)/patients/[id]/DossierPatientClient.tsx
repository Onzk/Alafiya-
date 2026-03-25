'use client'

import { useState } from 'react'
import Link from 'next/link'
import { User, Phone, Stethoscope, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, calculerAge, cn } from '@/lib/utils'

type Tab = 'informations' | 'contacts'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'informations', label: 'Informations patient', icon: User },
  { id: 'contacts',     label: 'Personnes à prévenir', icon: Phone },
]

type PersonneUrgence = {
  id: string
  nom: string
  prenoms: string
  telephone: string
  adresse: string
  relation: string
}

type PatientData = {
  nom: string
  prenoms: string
  genre: string
  dateNaissance: Date | string
  dateNaissancePresumee: boolean
  adresse: string
  telephone: string | null
  numeroCNI: string | null
  photo: string | null
  personnesUrgence: PersonneUrgence[]
}

type Specialite = { id: string; nom: string; code: string }

export function DossierPatientClient({
  patient,
  patientId,
  accesValide,
  modeUrgence,
  specialitesAccessibles,
}: {
  patient: PatientData
  patientId: string
  accesValide: boolean
  modeUrgence: boolean
  specialitesAccessibles: Specialite[]
}) {
  const [activeTab, setActiveTab] = useState<Tab>('informations')

  return (
    <div className="space-y-5">

      {/* ── Alertes ── */}
      {!accesValide && (
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-lg p-4 text-sm text-orange-800 dark:text-orange-300">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <p className="font-semibold">Accès non autorisé ou expiré</p>
          </div>
          <p>Scannez le QR code du patient pour obtenir l&apos;autorisation d&apos;accès.</p>
          <Link href="/scanner">
            <Button size="sm" className="mt-3">Aller au scanner</Button>
          </Link>
        </div>
      )}

      {modeUrgence && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-900/50 rounded-lg p-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span><strong>MODE URGENCE ACTIF</strong> — Accès complet. Session tracée.</span>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex overflow-x-auto border-b border-slate-100 dark:border-zinc-800 gap-1 no-scrollbar">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors flex-shrink-0',
              activeTab === id
                ? 'border-brand text-brand'
                : 'border-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Informations patient ── */}
      {activeTab === 'informations' && (
        <div className="space-y-5">
          <Card>
            <CardContent className="pt-5 space-y-4">
              {/* Photo + nom */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800 flex items-center justify-center ring-2 ring-slate-200 dark:ring-zinc-700 flex-shrink-0">
                  {patient.photo ? (
                    <img src={patient.photo} alt={`${patient.nom} ${patient.prenoms}`} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-7 w-7 text-slate-300 dark:text-zinc-600" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                    {patient.nom.toUpperCase()} {patient.prenoms}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                    {patient.genre === 'M' ? 'Homme' : 'Femme'} · {calculerAge(patient.dateNaissance)} ans
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-sm border-t border-slate-100 dark:border-zinc-800 pt-4">
                <div>
                  <p className="text-gray-500 dark:text-zinc-400 text-xs">Date de naissance</p>
                  <p>{formatDate(patient.dateNaissance)}{patient.dateNaissancePresumee && ' (présumée)'}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-zinc-400 text-xs">Adresse</p>
                  <p>{patient.adresse}</p>
                </div>
                {patient.telephone && (
                  <div>
                    <p className="text-gray-500 dark:text-zinc-400 text-xs">Téléphone</p>
                    <p>{patient.telephone}</p>
                  </div>
                )}
                {patient.numeroCNI && (
                  <div>
                    <p className="text-gray-500 dark:text-zinc-400 text-xs">Numéro CNI</p>
                    <p>{patient.numeroCNI}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Modules médicaux */}
          {accesValide && (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-green-600 dark:text-emerald-400" />
                Modules médicaux
                {modeUrgence && <Badge variant="destructive" className="text-xs">Toutes spécialités</Badge>}
              </h2>

              {specialitesAccessibles.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-gray-400 dark:text-zinc-500 text-sm">
                    Aucune spécialité assignée. Contactez votre administrateur.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {specialitesAccessibles.map((sp) => (
                    <Link key={sp.id} href={`/patients/${patientId}/modules/${sp.id}`}>
                      <Card className="hover:border-green-300 dark:hover:border-emerald-700 hover:shadow-md transition-all cursor-pointer">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-indigo-400/15 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 dark:text-indigo-300 text-xs font-bold">{sp.code.slice(0, 3)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{sp.nom}</p>
                            <p className="text-xs text-gray-400 dark:text-zinc-500">Voir les consultations →</p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Personnes à prévenir ── */}
      {activeTab === 'contacts' && (
        <Card className="border-orange-100 dark:border-orange-900/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-orange-700 dark:text-orange-400">
              <Phone className="h-4 w-4" />
              Personnes à prévenir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient.personnesUrgence.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-zinc-500 text-center py-4">
                Aucune personne à prévenir renseignée.
              </p>
            ) : (
              patient.personnesUrgence.map((p, i) => (
                <div
                  key={p.id}
                  className={`grid sm:grid-cols-2 gap-3 text-sm ${i > 0 ? 'border-t border-orange-50 dark:border-orange-900/20 pt-4' : ''}`}
                >
                  {patient.personnesUrgence.length > 1 && (
                    <p className="sm:col-span-2 text-xs font-semibold text-orange-500 dark:text-orange-400 uppercase tracking-widest">
                      Contact {i + 1}
                    </p>
                  )}
                  <div>
                    <p className="text-gray-500 dark:text-zinc-400 text-xs">Nom</p>
                    <p className="font-medium">{p.nom} {p.prenoms}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-zinc-400 text-xs">Relation</p>
                    <p>{p.relation}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-zinc-400 text-xs">Téléphone</p>
                    <p className="font-medium text-orange-700 dark:text-orange-400">{p.telephone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-zinc-400 text-xs">Adresse</p>
                    <p>{p.adresse}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

    </div>
  )
}
