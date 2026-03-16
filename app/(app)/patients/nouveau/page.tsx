'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NouveauPatientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')

  const [form, setForm] = useState({
    nom: '',
    prenoms: '',
    genre: 'M' as 'M' | 'F',
    dateNaissance: '',
    dateNaissancePresumee: false,
    adresse: '',
    telephone: '',
    email: '',
    numeroCNI: '',
    personneUrgence: {
      nom: '',
      prenoms: '',
      telephone: '',
      adresse: '',
      relation: '',
    },
  })

  const update = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateUrgence = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      personneUrgence: { ...prev.personneUrgence, [field]: value },
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErreur('')

    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        email: form.email || undefined,
        telephone: form.telephone || undefined,
        numeroCNI: form.numeroCNI || undefined,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setErreur(data.error || 'Erreur lors de la création du patient.')
      return
    }

    router.push(`/patients/${data.patient._id}/qrcode`)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/patients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau patient</h1>
          <p className="text-gray-500 text-sm">Créer un dossier médical patient</p>
        </div>
      </div>

      {erreur && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {erreur}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations principales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={form.nom}
                  onChange={(e) => update('nom', e.target.value)}
                  placeholder="NOM DE FAMILLE"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prenoms">Prénoms *</Label>
                <Input
                  id="prenoms"
                  value={form.prenoms}
                  onChange={(e) => update('prenoms', e.target.value)}
                  placeholder="Prénoms"
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Genre *</Label>
                <div className="flex gap-2">
                  {(['M', 'F'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => update('genre', g)}
                      className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${
                        form.genre === g
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {g === 'M' ? 'Homme' : 'Femme'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dateNaissance">Date de naissance *</Label>
                <Input
                  id="dateNaissance"
                  type="date"
                  value={form.dateNaissance}
                  onChange={(e) => update('dateNaissance', e.target.value)}
                  required
                />
              </div>

              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.dateNaissancePresumee}
                    onChange={(e) => update('dateNaissancePresumee', e.target.checked)}
                    className="accent-green-600"
                  />
                  Date présumée
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adresse">Adresse *</Label>
              <Input
                id="adresse"
                value={form.adresse}
                onChange={(e) => update('adresse', e.target.value)}
                placeholder="Quartier, ville"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Informations optionnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations optionnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => update('telephone', e.target.value)}
                  placeholder="+228 XX XX XX XX"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="email@exemple.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="numeroCNI">Numéro CNI</Label>
                <Input
                  id="numeroCNI"
                  value={form.numeroCNI}
                  onChange={(e) => update('numeroCNI', e.target.value)}
                  placeholder="N° carte d'identité"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personne à prévenir */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-base text-orange-700">
              Personne à prévenir en urgence *
            </CardTitle>
            <p className="text-xs text-gray-500">Obligatoire pour tous les patients</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input
                  value={form.personneUrgence.nom}
                  onChange={(e) => updateUrgence('nom', e.target.value)}
                  placeholder="Nom"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Prénoms *</Label>
                <Input
                  value={form.personneUrgence.prenoms}
                  onChange={(e) => updateUrgence('prenoms', e.target.value)}
                  placeholder="Prénoms"
                  required
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Téléphone *</Label>
                <Input
                  type="tel"
                  value={form.personneUrgence.telephone}
                  onChange={(e) => updateUrgence('telephone', e.target.value)}
                  placeholder="+228 XX XX XX XX"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Relation *</Label>
                <Input
                  value={form.personneUrgence.relation}
                  onChange={(e) => updateUrgence('relation', e.target.value)}
                  placeholder="Ex: Époux, Mère, Enfant..."
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Adresse *</Label>
                <Input
                  value={form.personneUrgence.adresse}
                  onChange={(e) => updateUrgence('adresse', e.target.value)}
                  placeholder="Adresse"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href="/patients">
            <Button variant="outline" type="button">
              Annuler
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Créer le dossier
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
