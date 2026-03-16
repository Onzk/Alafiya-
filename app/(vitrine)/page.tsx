import Link from 'next/link'
import {
  Shield,
  QrCode,
  Brain,
  Users,
  Building2,
  CheckCircle,
  ArrowRight,
  Phone,
  Lock,
  Activity,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-green-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">A+</span>
              </div>
              <span className="font-bold text-gray-900 text-xl">Alafiya Plus</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#fonctionnalites" className="text-sm text-gray-600 hover:text-green-600 transition-colors">
                Fonctionnalités
              </a>
              <a href="#comment" className="text-sm text-gray-600 hover:text-green-600 transition-colors">
                Comment ça marche
              </a>
              <a href="#securite" className="text-sm text-gray-600 hover:text-green-600 transition-colors">
                Sécurité
              </a>
              <a href="#contact" className="text-sm text-gray-600 hover:text-green-600 transition-colors">
                Contact
              </a>
            </nav>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Connexion
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
              <Activity className="h-4 w-4" />
              Plateforme nationale du Togo
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Les dossiers médicaux{' '}
              <span className="text-green-600">sécurisés et accessibles</span>{' '}
              partout au Togo
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Alafiya Plus centralise les dossiers médicaux patients à l&apos;échelle nationale.
              Grâce au QR code et à l&apos;intelligence artificielle, les professionnels de santé
              accèdent instantanément aux informations essentielles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Accéder à la plateforme
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 border border-green-600 text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
              >
                Nous contacter
              </a>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: '150+', label: 'Centres de santé' },
              { value: '50 000+', label: 'Patients enregistrés' },
              { value: '200+', label: 'Professionnels de santé' },
              { value: '99.9%', label: 'Disponibilité' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
                <p className="text-3xl font-bold text-green-600">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Fonctionnalités clés</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Une plateforme complète pour moderniser la gestion médicale au Togo.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: QrCode,
                title: 'QR Code sécurisé',
                desc: 'Chaque patient reçoit un QR code unique. Les professionnels scannent pour accéder instantanément au dossier, avec validation OTP par SMS.',
                color: 'bg-green-50 text-green-600',
              },
              {
                icon: Brain,
                title: 'Intelligence Artificielle',
                desc: 'Dictez vos observations à voix haute. L\'IA transcrit et structure automatiquement les données médicales dans le formulaire.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: Shield,
                title: 'Sécurité maximale',
                desc: 'Authentification JWT, chiffrement des données, accès limité à 1 heure, journalisation complète de toutes les actions.',
                color: 'bg-purple-50 text-purple-600',
              },
              {
                icon: Users,
                title: 'Multi-spécialités',
                desc: 'Les dossiers sont organisés par spécialité. Chaque médecin n\'accède qu\'à son module, garantissant la confidentialité.',
                color: 'bg-orange-50 text-orange-600',
              },
              {
                icon: Building2,
                title: 'Multi-établissements',
                desc: 'Un professionnel peut être affecté à plusieurs centres de santé et choisit son établissement actif à chaque connexion.',
                color: 'bg-teal-50 text-teal-600',
              },
              {
                icon: Activity,
                title: 'Mode urgence',
                desc: 'En cas d\'urgence, accès immédiat au dossier complet avec notification automatique par SMS à la personne de contact.',
                color: 'bg-red-50 text-red-600',
              },
            ].map((feat) => {
              const Icon = feat.icon
              return (
                <div key={feat.title} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className={`inline-flex p-3 rounded-lg ${feat.color} mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feat.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feat.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment" className="py-20 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Comment ça marche ?</h2>
            <p className="text-gray-600">Un processus simple et sécurisé en 4 étapes.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Création du dossier', desc: 'Le professionnel crée le dossier patient avec ses informations et génère un QR code unique.' },
              { step: '2', title: 'Scan du QR Code', desc: 'Lors d\'une consultation, le professionnel scanne le QR code du patient depuis l\'application.' },
              { step: '3', title: 'Validation d\'accès', desc: 'Le patient reçoit un code OTP par SMS et le communique au professionnel pour valider l\'accès.' },
              { step: '4', title: 'Consultation & IA', desc: 'Le médecin consulte le dossier, dicte ses observations et l\'IA structure automatiquement les données.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="h-12 w-12 rounded-full bg-green-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pour qui */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Pour qui ?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Ministère de la Santé',
                desc: 'Supervise l\'ensemble du système à l\'échelle nationale, gère les centres, les rôles et les spécialités.',
                items: ['Vue nationale des statistiques', 'Gestion des centres de santé', 'Définition des rôles et permissions'],
              },
              {
                title: 'Administrateurs de centres',
                desc: 'Gèrent les comptes et les accès du personnel médical de leur établissement.',
                items: ['Création de comptes médecins', 'Assignation des spécialités', 'Suivi des activités du centre'],
              },
              {
                title: 'Personnel médical',
                desc: 'Médecins, infirmiers et paramédicaux qui utilisent l\'application au quotidien.',
                items: ['Accès sécurisé aux dossiers', 'Dictée vocale assistée par IA', 'Gestion des consultations'],
              },
            ].map((group) => (
              <div key={group.title} className="border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 text-lg mb-2">{group.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{group.desc}</p>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sécurité */}
      <section id="securite" className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Sécurité & Confidentialité</h2>
              <p className="text-gray-600 mb-6">
                La protection des données médicales est notre priorité absolue. Alafiya Plus
                implémente les standards de sécurité les plus stricts.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: Lock, text: 'Authentification JWT avec mots de passe chiffrés bcrypt' },
                  { icon: QrCode, text: 'QR codes basés sur des tokens UUID v4 hashés uniques' },
                  { icon: Phone, text: 'Validation OTP par SMS avant tout accès au dossier' },
                  { icon: Activity, text: 'Journalisation complète de toutes les actions sensibles' },
                  { icon: Shield, text: 'Accès aux dossiers limité à 1 heure maximum par session' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.text} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700 text-sm leading-relaxed">{item.text}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-blue-100 p-8 shadow-lg">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-xl mb-2">Certifié & Sécurisé</h3>
                <p className="text-gray-500 text-sm">
                  Développé selon les normes de sécurité informatique médicale, sous la gouvernance
                  du Ministère de la Santé du Togo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Nous contacter</h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Vous êtes un établissement de santé ou une institution publique intéressée par Alafiya Plus ?
            Contactez-nous pour une démonstration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:contact@alafiya.tg"
              className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              contact@alafiya.tg
            </a>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 border border-green-600 text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
            >
              Connexion à la plateforme
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-green-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">A+</span>
            </div>
            <span className="text-white font-semibold">Alafiya Plus</span>
          </div>
          <p className="text-sm">
            © 2024 Ministère de la Santé du Togo — Tous droits réservés
          </p>
        </div>
      </footer>
    </div>
  )
}
