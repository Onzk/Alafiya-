# Alafiya Plus

Plateforme nationale PWA de gestion des dossiers médicaux patients au Togo.

## Stack technique

- **Next.js 14** (App Router)
- **PostgreSQL** + **Prisma** ORM
- **NextAuth.js v5** (JWT)
- **Tailwind CSS** + shadcn/ui
- **Ollama** local (Whisper tiny + Phi-3 Mini)
- **AfrikSMS** (envoi OTP par SMS)

## Prérequis

- Node.js 18+
- PostgreSQL 15+
- [Ollama](https://ollama.com) pour l'IA locale

## Installation

```bash
cd alafiya-plus
npm install
cp .env.example .env.local
# Remplir DATABASE_URL et les autres variables dans .env.local
```

## Base de données

```bash
# Générer le client Prisma
npm run db:generate

# Créer les tables (développement)
npm run db:push
# OU via migrations (production recommandé)
npm run db:migrate

# Seed initial (comptes admin + spécialités + permissions)
npm run db:seed

# Interface graphique Prisma Studio
npm run db:studio
```

## Variables d'environnement (.env.local)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/alafiya_plus"
NEXTAUTH_SECRET=<générer avec: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
AFRIKSMS_API_KEY=<votre clé API AfrikSMS>
AFRIKSMS_SENDER=AlafiyaPlus
OLLAMA_BASE_URL=http://localhost:11434
NEXT_PUBLIC_APP_NAME=Alafiya Plus
```

## Démarrage

```bash
npm run dev
```

## Comptes créés par le seed

| Rôle | Email | Mot de passe |
|---|---|---|
| Ministère | admin@ministere-sante.tg | AlafiyaMinistere2024! |
| Admin CHU | admin@chu-lomé.tg | AdminCHU2024! |

## Configuration Ollama (IA locale)

```bash
# Installer Ollama depuis https://ollama.com
ollama pull whisper
ollama pull phi3:mini
ollama serve
# Serveur disponible sur http://localhost:11434
```

## Architecture

```
prisma/
├── schema.prisma     # Schéma PostgreSQL complet
└── seed.ts           # Données initiales

app/
├── (vitrine)/        # Site public
├── (auth)/login/     # Connexion
└── (app)/            # Application protégée
    ├── dashboard/
    ├── patients/
    ├── scanner/
    ├── urgence/
    ├── admin/
    ├── ministere/
    └── logs/

lib/
├── db.ts             # Client Prisma singleton
├── auth.ts           # Config NextAuth
├── logger.ts         # Logs universels
├── otp.ts            # Génération/vérification OTP
├── afriksms.ts       # Envoi SMS
├── ollama.ts         # IA transcription + structuration
└── qrcode.ts         # Génération tokens QR
```

## Niveaux d'accès

| Niveau | Rôle | Accès |
|---|---|---|
| `MINISTERE` | Super admin national | Tout |
| `ADMIN_CENTRE` | Administrateur d'établissement | Son centre |
| `PERSONNEL` | Médecin, infirmier, paramédical | Ses patients + spécialités |
