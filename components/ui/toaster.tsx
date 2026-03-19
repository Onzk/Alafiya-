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

const variantIcon = {
  destructive: <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />,
  success: <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />,
  default: <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />,
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <Toast key={id} variant={variant} {...props}>
          {variantIcon[variant ?? 'default']}
          <div className="flex-1 grid gap-0.5">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
