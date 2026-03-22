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
      'fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'duration-300',
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
        // Mobile responsif : ancré en bas avec padding, pleine largeur utilisable
        'fixed bottom-0 left-1/2 -translate-x-1/2 z-50',
        'w-[calc(100%-2rem)] mx-auto mb-4',
        'rounded-2xl',
        // Desktop : centré, largeur max, arrondi partout
        'md:bottom-auto md:left-1/2 md:top-1/2 md:right-auto',
        'md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-2xl md:w-auto',
        // Fond + ombre améliorée
        'bg-white dark:bg-zinc-950',
        'border border-slate-200 dark:border-zinc-800/70',
        'shadow-xl shadow-black/20 dark:shadow-black/60',
        // Layout flex column + hauteur max pour le scroll interne
        'flex flex-col overflow-hidden',
        'max-h-[90dvh] md:max-h-[85vh]',
        // Animation améliorée avec fade et slide
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:fade-in data-[state=closed]:fade-out',
        'data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4',
        'md:data-[state=open]:zoom-in-95 md:data-[state=closed]:zoom-out-95',
        'md:data-[state=open]:slide-in-from-left-1/2 md:data-[state=open]:slide-in-from-top-[48%]',
        'md:data-[state=closed]:slide-out-to-left-1/2 md:data-[state=closed]:slide-out-to-top-[48%]',
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
      'flex-shrink-0',
      'flex items-start gap-3 md:gap-4',
      'px-5 py-2 md:py-6',
      className
    )}
    {...props}
  >
    {Icon && (
      <div className={cn(
        'h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl hidden sm:flex items-center justify-center flex-shrink-0',
        danger
          ? 'bg-red-50 dark:bg-red-500/15'
          : 'bg-emerald-50 dark:bg-emerald-500/15'
      )}>
        <Icon className={cn(
          'h-5 w-5 md:h-6 md:w-6',
          danger
            ? 'text-red-600 dark:text-red-400'
            : 'text-emerald-600 dark:text-emerald-400'
        )} />
      </div>
    )}
    <div className="flex-1 min-w-0 space-y-1">
      {title && (
        <DialogPrimitive.Title className="text-base md:text-lg font-bold text-slate-900 dark:text-white leading-tight break-words">
          {title}
        </DialogPrimitive.Title>
      )}
      {description && (
        <p className="text-xs md:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
          {description}
        </p>
      )}
      {children}
    </div>
    <DialogPrimitive.Close className="p-1.5 md:p-2 -mr-1.5 md:-mr-2 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-100/70 dark:hover:bg-zinc-800/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-0 flex-shrink-0 disabled:pointer-events-none">
      <X className="h-4 w-4" />
      <span className="sr-only">Fermer</span>
    </DialogPrimitive.Close>
  </div>
)
DialogHeader.displayName = 'DialogHeader'

const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex-1 overflow-y-auto px-5 md:px-7 py-5 md:py-6 space-y-4', className)} {...props} />
)
DialogBody.displayName = 'DialogBody'

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex-shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 md:gap-3 px-5 md:px-7 py-4 md:py-5 border-t border-slate-100 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900/50', className)} {...props} />
)
DialogFooter.displayName = 'DialogFooter'

/**
 * Wrapper scrollable pour les contenus longs dans les dialogs
 * À utiliser directement dans DialogContent pour les formulaires/listes longues
 */
const DialogScrollableWrapper = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex-1 overflow-y-auto px-5 md:px-7 pt-2 pb-6', className)} {...props} />
)
DialogScrollableWrapper.displayName = 'DialogScrollableWrapper'

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
  DialogScrollableWrapper,
  DialogTitle,
  DialogDescription,
}
