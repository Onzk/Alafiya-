'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-emerald-950/30 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'duration-200',
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Positionnement mobile : ancré en bas, pleine largeur, arrondi seulement en haut
        'fixed bottom-0 left-0 right-0 z-50 w-full',
        'rounded-t-2xl',
        // Positionnement desktop : centré, largeur max, arrondi partout
        'sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:right-auto',
        'sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:rounded-2xl',
        // Fond + ombre
        'bg-white dark:bg-zinc-950 dark:border dark:border-zinc-800',
        'shadow-2xl shadow-black/10 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-zinc-800/50',
        // Layout flex column + hauteur max pour le scroll interne
        'flex flex-col overflow-hidden max-h-[90dvh] p-4',
        // Animation
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
        'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        'duration-300 ease-out',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  icon?: React.ElementType
  danger?: boolean
}

const DialogHeader = ({ className, title, description, icon: Icon, danger, children, ...props }: DialogHeaderProps) => (
  <div
    className={cn(
      'top-0 z-10 flex-shrink-0',
      'flex items-start gap-4',
      'pb-4 pt-2',
      className
    )}
    {...props}
  >
    {Icon && (
      <div className={cn(
        'h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0',
        danger
          ? 'bg-red-50 dark:bg-red-500/10'
          : 'bg-emerald-50 dark:bg-emerald-500/10'
      )}>
        <Icon className={cn(
          'h-6 w-6',
          danger
            ? 'text-red-500 dark:text-red-400'
            : 'text-emerald-600 dark:text-emerald-400'
        )} />
      </div>
    )}
    <div className="flex-1 min-w-0 space-y-2">
      {title && (
        <DialogPrimitive.Title className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">
          {title}
        </DialogPrimitive.Title>
      )}
      {description && (
        <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
          {description}
        </p>
      )}
      {children}
    </div>
    <DialogPrimitive.Close className="p-2 -mr-2 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-200/50 dark:hover:bg-zinc-700/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-0 flex-shrink-0 disabled:pointer-events-none">
      <X className="h-4 w-4" />
      <span className="sr-only">Fermer</span>
    </DialogPrimitive.Close>
  </div>
)
DialogHeader.displayName = 'DialogHeader'

const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex-1 overflow-y-auto px-6 py-5 space-y-4', className)} {...props} />
)
DialogBody.displayName = 'DialogBody'

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex-shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-zinc-800/50', className)} {...props} />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-base font-extrabold leading-tight text-slate-900 dark:text-white', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-xs text-slate-500 dark:text-zinc-400 leading-relaxed', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
