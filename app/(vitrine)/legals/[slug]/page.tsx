import fs from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/* ── Mapping slug → fichier .md ── */
const SLUGS: Record<string, { file: string; title: string }> = {
  'politique-de-confidentialite': {
    file: 'politique-de-confidentialite.md',
    title: 'Politique de confidentialité',
  },
  'conditions-utilisation': {
    file: 'conditions-utilisation.md',
    title: "Conditions générales d'utilisation",
  },
  'mentions-legales': {
    file: 'mentions-legales.md',
    title: 'Mentions légales',
  },
  'securite-confidentialite': {
    file: 'securite-confidentialite.md',
    title: 'Sécurité & Confidentialité',
  },
  'aide-en-ligne': {
    file: 'aide-en-ligne.md',
    title: 'Aide en ligne',
  },
  'cookies': {
    file: 'cookies.md',
    title: 'Politique de cookies',
  },
}

export function generateStaticParams() {
  return Object.keys(SLUGS).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = SLUGS[slug]
  if (!entry) return {}
  return { title: `${entry.title} — Alafiya Plus` }
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = SLUGS[slug]
  if (!entry) notFound()

  const filePath = path.join(process.cwd(), 'public', 'legals', entry.file)
  let content = ''
  try {
    content = fs.readFileSync(filePath, 'utf-8')
  } catch {
    notFound()
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative bg-white dark:bg-zinc-950 overflow-hidden pt-20 pb-12 border-b border-slate-100 dark:border-zinc-800/50">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(33,196,136,0.08) 0%, transparent 70%)' }}
          />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {entry.title}
          </h1>
        </div>
      </section>

      {/* ── Contenu markdown ── */}
      <section className="pt-6 pb-24 bg-slate-50 dark:bg-zinc-950 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-transparent">
          <article className="prose prose-slate dark:prose-invert max-w-none
            [&>*]:leading-10
            prose-headings:font-extrabold prose-headings:tracking-tight
            prose-h1:text-2xl prose-h1:mb-6 prose-h1:text-brand prose-h1:leading-snug
            prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:leading-snug
            prose-h3:text-base prose-h3:mt-6 prose-h3:mb-3 prose-h3:leading-snug
            prose-p:text-slate-600 dark:prose-p:text-zinc-400 prose-p:leading-8
            prose-li:text-slate-600 dark:prose-li:text-zinc-400 prose-li:leading-8
            prose-strong:text-slate-800 dark:prose-strong:text-zinc-200
            prose-hr:border-slate-200 dark:prose-hr:border-zinc-800 prose-hr:my-8
            prose-a:text-brand prose-a:no-underline hover:prose-a:underline
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </article>
          </div>
        </div>
      </section>
    </>
  )
}
