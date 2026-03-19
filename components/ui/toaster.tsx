'use client'

import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const variantConfig = {
  destructive: {
    icon: AlertCircle,
    badge: 'bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-400',
  },
  success: {
    icon: CheckCircle2,
    badge: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400',
  },
  default: {
    icon: Info,
    badge: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400',
  },
} as const

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => {
        const key = (variant ?? 'default') as keyof typeof variantConfig
        const { icon: Icon, badge } = variantConfig[key]
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className={cn('flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center', badge)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 grid gap-0.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
