# Alafiya Plus

**Dossier médical numérique pour le Togo** — développé par [N'di Solutions](https://ndisolutions.tg), sous autorisation du Ministère de la Santé du Togo.

---

## Présentation

Au Togo, chaque patient possède aujourd'hui un carnet médical papier qu'il peut perdre, oublier ou endommager. Lorsqu'il change de centre de santé, son historique ne le suit pas : le nouveau médecin repart de zéro, les examens sont répétés inutilement, les prescriptions incompatibles passent inaperçues.

**Alafiya Plus** résout ce problème en offrant à chaque patient un carnet médical numérique unique, sécurisé et accessible dans tous les centres de santé partenaires du Togo — via un simple QR code.

### Ce que la plateforme apporte

| Pour les patients | Pour les centres de santé | Pour N'di Solutions |
|---|---|---|
| Un QR code unique pour toute la vie | Dossiers complets accessibles en quelques secondes | Tableau de bord national de supervision |
| Historique médical centralisé | Dictée vocale IA pour réduire le temps de saisie | Gestion de tous les centres et utilisateurs |
| Alerte SMS automatique en cas d'urgence | Mode urgence avec accès simplifié | Suivi des factures et indicateurs globaux |
| Données hébergées au Togo | Gestion fine des accès par spécialité | Journal d'audit complet |

La zone de lancement est le **Grand Lomé** (Année 1), avec une extension nationale prévue.

---

## Fonctionnalités principales

### Dossier médical numérique
- Création d'un dossier patient unique avec photo et QR code
- Organisation par spécialité médicale (cardiologie, pédiatrie, gynécologie…)
- Consultations structurées avec ordonnances et documents attachés
- Sous-consultations de suivi rattachées à une consultation principale

### Intelligence artificielle (Ollama local)
- **Dictée vocale** : transcription audio → texte en temps réel (modèle Whisper)
- **Structuration IA** : conversion du texte libre en formulaire médical structuré
- **Chatbot dossier** : assistant contextuel pour interroger le dossier d'un patient

### Scanner QR
- Identification instantanée du patient par scan caméra
- Redirection automatique vers le dossier correspondant

### Mode urgence
- Accès simplifié au dossier sans authentification préalable du patient
- Recherche par nom, date de naissance ou numéro de téléphone
- Notification SMS automatique à la personne de confiance désignée

### Accès document public
- Partage sécurisé d'un document via lien avec vérification OTP (SMS AfrikSMS) ou signature électronique

### Administration
- Dashboard admin par centre (KPIs, graphiques, gestion du personnel et des rôles)
- Dashboard superadmin N'di Solutions (supervision globale, tous centres)
- Journal d'audit horodaté et filtrable de toutes les actions sur la plateforme

### Site vitrine intégré
- Présentation publique de la plateforme
- Formulaire d'inscription pour les centres de santé
- Formulaire de candidature pour les agents de terrain

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 14 (App Router) |
| Base de données | MongoDB |
| Authentification | NextAuth.js v5 (JWT) |
| ORM / schéma | Prisma (migrations) |
| UI | Tailwind CSS + Radix UI + shadcn/ui |
| Graphiques | Recharts |
| IA locale | Ollama (Whisper + Phi-3 Mini) |
| SMS OTP | AfrikSMS |
| QR Code | html5-qrcode + qrcode.react |
| Signature | signature_pad |
| Validation | Zod |
| Langage | TypeScript |

---

## Prérequis

- **Node.js** 18+
- **MongoDB** 6+ (instance locale ou Atlas)
- **[Ollama](https://ollama.com)** (pour l'IA locale)
- Compte **AfrikSMS** (pour l'envoi des SMS OTP)

---

## Installation

```bash
git clone <repo>
cd Alafiya-
npm install
cp .env.example .env.local
# Remplir les variables dans .env.local
```

---

## Variables d'environnement

Créer un fichier `.env.local` à la racine :

```env
# Base de données
MONGODB_URI=mongodb://localhost:27017/alafiya_plus

# NextAuth
NEXTAUTH_SECRET=<générer avec: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# AfrikSMS (OTP par SMS)
AFRIKSMS_API_KEY=<votre clé API>
AFRIKSMS_SENDER=AlafiyaPlus

# Ollama (IA locale)
OLLAMA_BASE_URL=http://localhost:11434

# Email (notifications vitrine)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASS=<mot de passe>
NOTIFICATION_EMAIL=equipe@ndisolutions.tg

# App
NEXT_PUBLIC_APP_NAME=Alafiya Plus
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Base de données

```bash
# Générer le client Prisma
npm run db:generate

# Pousser le schéma (développement)
npm run db:push

# Seed initial (comptes, spécialités, permissions)
npm run db:seed

# Interface graphique Prisma Studio
npm run db:studio
```

---

## Configuration Ollama (IA locale)

```bash
# 1. Installer Ollama depuis https://ollama.com

# 2. Télécharger les modèles nécessaires
ollama pull whisper   # Transcription vocale
ollama pull phi3:mini # Structuration et chatbot

# 3. Démarrer le serveur Ollama
ollama serve
# Disponible sur http://localhost:11434
```

---

## Démarrage

```bash
# Développement
npm run dev

# Production
npm run build
npm run start
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

---

## Niveaux d'accès

| Niveau | Description | Périmètre |
|---|---|---|
| `SUPERADMIN` | Équipe N'di Solutions | Accès total à tous les centres, utilisateurs et données |
| `ADMIN_CENTRE` | Administrateur d'un centre | Gestion complète de son établissement |
| `PERSONNEL` | Médecin, infirmier, paramédical | Accès opérationnel selon rôle et spécialité assignés |

### Permissions granulaires

Les rôles sont entièrement personnalisables par centre. Les permissions disponibles sont :

`create-patient` · `read-dossier` · `write-dossier` · `urgence-access` · `scan-qr` · `create-user` · `manage-roles` · `manage-centres` · `manage-specialites` · `view-logs`

---

## Architecture des routes

```
app/
├── (vitrine)/          → Site public (aucune auth requise)
│   ├── /               → Accueil + formulaires vitrine
│   ├── /fonctionnalites
│   ├── /a-propos
│   ├── /partenaires
│   ├── /contact
│   └── /legals/[slug]
│
├── (auth)/
│   └── /login          → Authentification
│
└── (app)/              → Application protégée
    ├── /dashboard
    ├── /patients
    ├── /scanner
    ├── /urgence
    ├── /profil
    ├── /parametres
    ├── /logs
    ├── /admin/         → Dashboard Admin Centre
    └── /superadmin/    → Dashboard N'di Solutions
```

---

## Modèle de données (collections MongoDB)

| Collection | Contenu |
|---|---|
| `utilisateurs` | Personnel, admins, superadmin |
| `centres` | Centres de santé partenaires |
| `patients` | Dossiers patients |
| `enregistrements` | Consultations médicales |
| `ordonnances` | Ordonnances par consultation |
| `documents` | Fichiers attachés |
| `roles` | Rôles personnalisables par centre |
| `permissions` | Permissions associées aux rôles |
| `specialites` | Spécialités médicales |
| `factures` | Facturation centres |
| `logs` | Journal d'audit |
| `otp_codes` | Codes OTP temporaires |
| `centre_inscriptions` | Candidatures centres (vitrine) |
| `agent_candidatures` | Candidatures agents (vitrine) |

---

## Flux principaux

### Consultation classique
```
Patient présente son QR code
  → Personnel scanne → /scanner
  → Dossier ouvert → /patients/[id]
  → Sélection spécialité → /patients/[id]/modules/[specialite]
  → Nouvelle consultation (dictée vocale IA ou saisie manuelle)
  → Enregistrement + ordonnance
```

### Mode urgence
```
Urgentiste → /urgence
  → Recherche patient (nom / date naissance / téléphone)
  → Accès dossier en lecture rapide
  → Notification SMS automatique à la personne de confiance
```

### Inscription centre partenaire (vitrine)
```
Responsable remplit le formulaire → /
  → Email de confirmation automatique
  → Notification équipe N'di Solutions
  → Enregistrement dans MongoDB (centre_inscriptions)
```

---

## Services externes

| Service | Usage | Fichier |
|---|---|---|
| MongoDB | Base de données principale | `lib/db.ts` |
| NextAuth | Authentification & sessions JWT | `lib/auth.ts` |
| Ollama | IA : transcription, structuration, chatbot | `lib/ollama.ts` |
| AfrikSMS | Envoi SMS OTP | `lib/afriksms.ts` |

---

## Sécurité

- Chiffrement SSL/TLS sur toutes les communications
- Données hébergées physiquement au Togo — aucune sortie du territoire national
- Accès strictement limité à la spécialité du professionnel de santé
- Chaque accès à un dossier est tracé et horodaté (`logs`)
- OTP SMS à usage unique pour l'accès aux documents partagés
- Aucune donnée patient transmise à des tiers

---

## Licence

Propriété de **N'di Solutions** — Tous droits réservés.  
Développé sous autorisation du Ministère de la Santé du Togo.
