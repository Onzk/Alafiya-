'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export function QRUnlockButton({ patientId }: { patientId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleUnlock() {
    setLoading(true)
    const res = await fetch(`/api/patients/${patientId}/qr-acces`, { method: 'POST' })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      toast({ description: data.error || 'Erreur', variant: 'destructive' })
      return
    }
    router.refresh()
  }

  return (
    <Button onClick={handleUnlock} disabled={loading} className="bg-brand hover:bg-brand-dark text-white">
      {loading ? (
        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Confirmation...</>
      ) : (
        <><UserCheck className="mr-2 h-4 w-4" />Confirmer la présence du patient</>
      )}
    </Button>
  )
}
