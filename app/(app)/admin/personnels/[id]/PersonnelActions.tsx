'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Power, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface Props {
  id: string
  nom: string
  prenoms: string
  estActif: boolean
}

export function PersonnelActions({ id, nom, prenoms, estActif }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [toggling, setToggling]       = useState(false)
  const [deleteOpen, setDeleteOpen]   = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [actif, setActif]             = useState(estActif)

  async function handleToggle() {
    setToggling(true)
    const res = await fetch(`/api/utilisateurs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estActif: !actif }),
    })
    setToggling(false)
    if (res.ok) {
      setActif((v) => !v)
      toast({ description: actif ? 'Personnel désactivé' : 'Personnel activé' })
    } else {
      toast({ description: 'Erreur lors de la mise à jour', variant: 'destructive' })
    }
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/utilisateurs/${id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) {
      toast({ description: 'Personnel supprimé' })
      router.push('/admin/personnels')
    } else {
      toast({ description: 'Erreur lors de la suppression', variant: 'destructive' })
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={handleToggle}
        disabled={toggling}
        className={`h-10 rounded-xl gap-2 ${
          actif
            ? 'border-orange-200 dark:border-orange-400/30 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-400/10'
            : 'border-brand/30 text-brand hover:bg-brand/5'
        }`}
      >
        {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
        {actif ? 'Désactiver' : 'Activer'}
      </Button>

      <Button
        variant="outline"
        onClick={() => setDeleteOpen(true)}
        className="h-10 rounded-xl gap-2 border-red-200 dark:border-red-400/30 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10"
      >
        <Trash2 className="h-4 w-4" />
        Supprimer
      </Button>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader
            title="Supprimer le personnel ?"
            description={`Vous êtes sur le point de supprimer ${nom} ${prenoms}. Cette action est irréversible.`}
            icon={Trash2}
            danger
          />
          <div className="flex gap-3 px-5 md:px-7 pb-5 md:pb-6">
            <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setDeleteOpen(false)}>
              Annuler
            </Button>
            <Button
              className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Supprimer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
