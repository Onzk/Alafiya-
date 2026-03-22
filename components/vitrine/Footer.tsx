import Link from 'next/link'
import { LogoIcon } from '@/components/ui/logo'
import { MapPin, Phone, Mail, Facebook, Twitter } from 'lucide-react'

const NAV_LINKS = [
  { href: '/',                label: 'Accueil' },
  { href: '/fonctionnalites', label: 'Fonctionnalités' },
  { href: '/partenaires',     label: 'Nos Partenaires' },
  { href: '/a-propos',        label: 'À Propos' },
  { href: '/contact',         label: 'Contact' },
]

const SUPPORT_LINKS = [
  { label: "Aide en ligne",                href: "/legals/aide-en-ligne" },
  { label: "Sécurité & Confidentialité",   href: "/legals/securite-confidentialite" },
  { label: "Conditions d'utilisation",     href: "/legals/conditions-utilisation" },
]

export function VitrineFooter() {
  return (
    <footer className="bg-white dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800/50">

      {/* ── Colonnes principales ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-12">

          {/* Marque */}
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-2.5">
              <LogoIcon className="h-7 w-7 text-emerald-500 dark:text-emerald-400" />
              <span className="font-extrabold text-slate-900 dark:text-white">
                Alafiya <span className="text-brand">Plus</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 dark:text-zinc-500 leading-relaxed">
              La solution de santé numérique de référence au Togo, développée par{' '}
              <span className="font-medium text-slate-500 dark:text-zinc-400">N&apos;di Solutions</span>{' '}
              sous autorisation du Ministère de la Santé.
            </p>
            <div className="flex gap-2">
              <a
                href="#"
                aria-label="Facebook"
                className="h-9 w-9 rounded-xl vitrine-card-muted flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-brand hover:text-white transition-all"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="h-9 w-9 rounded-xl vitrine-card-muted flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-brand hover:text-white transition-all"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600">
              Navigation
            </p>
            <ul className="space-y-3.5">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-500 dark:text-zinc-400 hover:text-brand dark:hover:text-brand transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600">
              Support
            </p>
            <ul className="space-y-3.5">
              {SUPPORT_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-slate-500 dark:text-zinc-400 hover:text-brand dark:hover:text-brand transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600">
              Contact
            </p>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-3 text-sm text-slate-500 dark:text-zinc-400">
                <MapPin className="h-4 w-4 text-brand flex-shrink-0 mt-0.5" />
                Lomé, Togo
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-500 dark:text-zinc-400">
                <Phone className="h-4 w-4 text-brand flex-shrink-0" />
                +228 00 00 00 00
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-500 dark:text-zinc-400">
                <Mail className="h-4 w-4 text-brand flex-shrink-0" />
                contact@alafiya.tg
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* ── Barre légale ── */}
      <div className="border-t border-slate-100 dark:border-zinc-800/50 py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 dark:text-zinc-600">
            © 2025 Alafiya Plus — N&apos;di Solutions. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6">
            {[
              { label: 'Confidentialité',  href: '/legals/politique-de-confidentialite' },
              { label: 'Mentions légales', href: '/legals/mentions-legales' },
              { label: 'Cookies',          href: '/legals/cookies' },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-xs text-slate-400 dark:text-zinc-600 hover:text-brand transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

    </footer>
  )
}
