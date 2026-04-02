# Alafiya Plus — Architecture complète de l'application

> **Stack :** Next.js 14 (App Router) · MongoDB · NextAuth · Tailwind CSS · Ollama (IA)
> **Propriétaire :** N'di Solutions · Autorisation Ministère de la Santé du Togo

---

## Vue d'ensemble — Groupes de routes

```
/root/alafiya+/Alafiya-/app/
├── (vitrine)/          → Site public, aucune auth requise
├── (auth)/             → Authentification
└── (app)/              → Application protégée (session requise)
```

---

## 1. SITE VITRINE — `(vitrine)/`

```
/ ─────────────── Page d'accueil
│   ├── Hero + CTA
│   ├── Stats (150+ centres, 50 000+ patients, 99.9% dispo)
│   ├── Comment ça marche (4 étapes : Inscription → QR → Consultation → Suivi)
│   ├── Avantages Patients
│   ├── Avantages Médecins / Centres
│   ├── Section Agents de terrain
│   ├── Formulaire inscription centre  → POST /api/vitrine/inscription-centre
│   └── Formulaire candidature agent   → POST /api/vitrine/candidature-agent
│
├── /fonctionnalites ── Détail des fonctionnalités
├── /a-propos ────────── À propos de N'di Solutions
├── /partenaires ─────── Centres partenaires
├── /contact ─────────── Formulaire de contact
└── /legals/[slug] ───── Pages légales (CGU, politique de confidentialité…)

Composants vitrine :
  components/vitrine/Navbar.tsx        ← Navigation publique
  components/vitrine/Footer.tsx        ← Pied de page
  components/vitrine/CookieBanner.tsx  ← Bandeau RGPD
```

---

## 2. AUTHENTIFICATION — `(auth)/`

```
/login ──────────────── Connexion email + mot de passe (NextAuth)
                        → Session étendue : niveauAcces, centres, specialites, permissions

Niveaux d'accès (NiveauAcces) :
  SUPERADMIN     → Accès total, toutes routes
  ADMIN_CENTRE   → Gestion du centre assigné
  PERSONNEL      → Accès opérationnel (selon permissions)

Permissions granulaires (lib/permissions.ts) :
  create-patient   · read-dossier   · write-dossier
  urgence-access   · scan-qr        · create-user
  manage-roles     · manage-centres · manage-specialites · view-logs

Middleware (middleware.ts) :
  /superadmin/* → SUPERADMIN uniquement
  /admin/*      → SUPERADMIN ou ADMIN_CENTRE
  Tout le reste → session valide requise
```

---

## 3. APPLICATION — `(app)/`

### 3.1 Dashboard Général

```
/dashboard ────────────── Tableau de bord principal (PERSONNEL / ADMIN_CENTRE)
  └── Accès rapide : scanner, nouveau patient, urgence, dossiers récents
```

### 3.2 Patients & Dossiers

```
/patients ─────────────── Liste des patients du centre
/patients/nouveau ──────── Créer un nouveau patient
/patients/[id] ─────────── Fiche patient
│   ├── Photo, identité, informations
│   ├── QR Code du patient
│   └── Onglets : Résumé · Documents · Modules spécialités
│
/patients/[id]/modifier ── Modifier les informations du patient
/patients/[id]/qrcode ──── Affichage / impression du QR code
/patients/[id]/documents ─ Gestion des documents attachés
│
/patients/[id]/modules/[specialite] ──────── Dossier par spécialité
│   ├── Liste des enregistrements (consultations)
│   ├── Recherche dans le dossier
│   └── Formulaire d'enregistrement (DicteeVocale IA + structuration IA)
│
/patients/[id]/modules/[specialite]/[enrId]/sous-consultation
│   └── Ajout d'une sous-consultation / suivi
```

### 3.3 Scanner QR

```
/scanner ──────────────── Scan QR code patient → redirection vers /patients/[id]
                          Composant : components/qrcode/QRScanner.tsx
```

### 3.4 Accès d'urgence

```
/urgence ──────────────── Mode urgence (accès sans authentification du patient)
                          Permission requise : urgence-access
/urgence/resultats ─────── Résultats de la recherche d'urgence
```

### 3.5 Accès Document public

```
/acces-document ────────── Consultation d'un document via lien sécurisé (OTP ou signature)
```

### 3.6 Profil & Paramètres

```
/profil ───────────────── Profil de l'utilisateur connecté (photo, infos, mdp)
/parametres ───────────── Configuration du compte / centre
```

### 3.7 Logs

```
/logs ─────────────────── Journal d'audit des actions (Permission : view-logs)
  ├── Filtres (type, date, utilisateur)
  └── Tableau paginé des événements
```

---

## 4. DASHBOARD ADMIN CENTRE — `(app)/admin/`

```
/admin/dashboard ──────── KPIs du centre + graphiques
│   ├── Statistiques : patients, consultations, revenus
│   ├── DashboardCharts (recharts)  ← components/admin/dashboard-charts.tsx
│   └── RevenueChart                ← components/admin/revenue-chart.tsx
│
/admin/patients ────────── Liste patients (vue admin)
/admin/patients/[id] ───── Fiche patient (vue admin)
│
/admin/personnels ──────── Liste des personnels du centre
/admin/personnels/nouveau ─ Ajouter un personnel
/admin/personnels/[id] ──── Profil d'un personnel
/admin/personnels/[id]/modifier ── Modifier
│
/admin/roles ───────────── Gestion des rôles et permissions du centre
/admin/factures ────────── Factures et paiements du centre
```

---

## 5. DASHBOARD SUPERADMIN — `(app)/superadmin/`

```
/superadmin/dashboard ─────── KPIs globaux N'di Solutions
│   ├── Tous les centres, médecins, revenus
│   ├── DashboardCharts (global)  ← components/superadmin/dashboard-charts.tsx
│   └── FacturesChart             ← components/superadmin/factures-chart.tsx
│
/superadmin/centres ───────────── Liste de tous les centres
/superadmin/centres/nouveau ────── Créer un centre
/superadmin/centres/[id] ──────── Détail d'un centre
│   └── CentreCharts              ← components/superadmin/centre-charts.tsx
/superadmin/centres/[id]/modifier ── Modifier
│
/superadmin/medecins ──────────── Liste de tous les médecins / utilisateurs
/superadmin/medecins/nouveau ───── Ajouter
/superadmin/medecins/[id] ──────── Détail
/superadmin/medecins/[id]/modifier ── Modifier
│
/superadmin/roles ─────────────── Gestion des rôles (globale)
/superadmin/specialites ────────── Gestion des spécialités médicales
/superadmin/factures ───────────── Toutes les factures (tous centres)
```

---

## 6. APIs — `app/api/`

### Auth & Session
```
POST /api/auth/[...nextauth]      ← NextAuth handlers
POST /api/auth/logout             ← Déconnexion
GET  /api/session/centre          ← Centre actif de la session
```

### Patients & Dossiers
```
GET/POST   /api/patients                   ← Liste / créer patient
GET/PUT    /api/patients/[id]              ← Fiche / modifier patient
POST       /api/patients/[id]/photo        ← Upload photo
GET/POST   /api/patients/[id]/documents    ← Documents du patient
GET/DELETE /api/patients/[id]/documents/patient/[docId]
GET/POST   /api/patients/[id]/documents/identification
GET/DELETE /api/patients/[id]/documents/identification/[docId]
GET/POST   /api/patients/[id]/qr-acces     ← Générer / lire token QR
```

### Enregistrements (consultations)
```
GET/POST   /api/enregistrements/[enrId]
GET/POST   /api/enregistrements/[enrId]/ordonnances
GET/DELETE /api/enregistrements/[enrId]/ordonnances/[ordId]
GET/POST   /api/enregistrements/[enrId]/documents
GET/DELETE /api/enregistrements/[enrId]/documents/[docId]
```

### Dossiers & Accès QR
```
GET  /api/dossiers/[id]                    ← Dossier complet
GET  /api/acces-dossier/[id]              ← Accès via token
POST /api/qrcode/scan                      ← Scan QR et résolution
GET  /api/acces/document-identification    ← Document d'identification
```

### IA (Ollama)
```
POST /api/ia/transcription    ← Audio → texte (Whisper)
POST /api/ia/structuration    ← Texte → formulaire structuré
POST /api/ia/chatbot          ← Chatbot contextuel dossier
```

### OTP & Signature
```
POST /api/otp/envoyer         ← Envoi OTP via AfrikSMS
POST /api/otp/valider         ← Vérification OTP
POST /api/signature/valider   ← Validation signature électronique
```

### Administration
```
GET/PUT  /api/admin/centre              ← Config du centre
GET      /api/admin/dashboard/charts    ← Données graphiques admin
GET      /api/admin/dashboard/revenue   ← Données revenus admin
GET      /api/admin/factures            ← Factures du centre
GET      /api/admin/factures/[id]/detail
GET      /api/admin/search              ← Recherche globale (Command Palette)
```

### Superadmin
```
GET/POST   /api/centres           ← CRUD centres
GET/PUT/DELETE /api/centres/[id]
GET/POST   /api/utilisateurs      ← CRUD utilisateurs
GET/PUT/DELETE /api/utilisateurs/[id]
GET/POST   /api/roles             ← CRUD rôles
GET/PUT/DELETE /api/roles/[id]
GET/POST   /api/permissions       ← Liste permissions
GET/PUT    /api/configuration/paiement ← Config paiement
```

### Profil & Logs
```
GET/PUT /api/profil               ← Profil connecté
GET     /api/logs                 ← Journal d'audit
```

---

## 7. COMPOSANTS CLÉS

```
Layout
  components/layout/Sidebar.tsx          ← Menu latéral (app)
  components/layout/Header.tsx           ← En-tête (app)
  components/layout/MobileNav.tsx        ← Navigation mobile
  components/layout/NavigationProgress.tsx ← Barre de chargement

Dossier médical
  components/dossier/ConsultationCard.tsx       ← Carte de consultation
  components/dossier/FormulaireEnregistrement.tsx ← Formulaire de saisie
  components/dossier/OrdonnanceLigneChamp.tsx   ← Ligne d'ordonnance

IA
  components/ia/DicteeVocale.tsx          ← Dictée vocale → transcription
  components/ia/ChatbotDossier.tsx        ← Chatbot IA sur le dossier

QR Code
  components/qrcode/QRCodeDisplay.tsx     ← Affichage QR
  components/qrcode/QRScanner.tsx         ← Lecteur caméra

Patients
  components/patients/DocumentsTab.tsx              ← Onglet documents
  components/patients/GestionDocumentsIdentification.tsx
  components/patients/PhotoPicker.tsx               ← Capture photo

Accès
  components/acces/PhotoCapture.tsx       ← Capture photo pour accès urgence

UI
  components/ui/CommandPalette.tsx        ← Palette de commandes (Ctrl+K)
  components/ui/SignaturePad.tsx          ← Signature électronique
```

---

## 8. SERVICES EXTERNES

```
AfrikSMS       → Envoi SMS OTP (lib/afriksms.ts)
Ollama (local) → IA : transcription, structuration, chatbot (lib/ollama.ts)
MongoDB        → Base de données principale (lib/db.ts)
NextAuth       → Authentification & sessions (lib/auth.ts)
```

---

## 9. FLUX PRINCIPAUX

### Flux Patient — Consultation classique
```
Patient arrive → Présente QR code
  → Personnel scanne → /scanner
  → QR résolu → /api/qrcode/scan
  → Redirection → /patients/[id]
  → Sélection spécialité → /patients/[id]/modules/[specialite]
  → Nouvelle consultation → FormulaireEnregistrement
      ├── Dictée vocale → /api/ia/transcription → /api/ia/structuration
      └── Saisie manuelle
  → Enregistrement → POST /api/enregistrements/[enrId]
  → Ordonnance si besoin → POST /api/enregistrements/[enrId]/ordonnances
```

### Flux Urgence
```
Personnel urgentiste → /urgence (Permission : urgence-access)
  → Recherche patient (nom, date naissance, téléphone)
  → /urgence/resultats
  → Accès dossier en mode lecture rapide
```

### Flux Accès Document Public
```
Patient reçoit lien → /acces-document
  → Saisie OTP (SMS via AfrikSMS) ou signature
  → Vérification → /api/otp/valider ou /api/signature/valider
  → Affichage document
```

### Flux Inscription Centre (Vitrine)
```
Responsable centre → / (section inscription)
  → Remplit formulaire
  → POST /api/vitrine/inscription-centre
  → Email confirmation → Responsable
  → Notification → Équipe N'di Solutions
  → Enregistrement MongoDB → collection centre_inscriptions
```

### Flux Candidature Agent (Vitrine)
```
Candidat → / (section agents)
  → Remplit formulaire
  → POST /api/vitrine/candidature-agent
  → Email confirmation → Candidat
  → Notification → Équipe N'di Solutions
  → Enregistrement MongoDB → collection agent_candidatures
```

---

## 10. MODÈLE DE DONNÉES (collections MongoDB)

```
utilisateurs          ← Personnel, admins, superadmin
centres               ← Centres de santé partenaires
patients              ← Dossiers patients
enregistrements       ← Consultations médicales
ordonnances           ← Ordonnances par enregistrement
documents             ← Fichiers attachés (dossier ou enregistrement)
roles                 ← Rôles personnalisables par centre
permissions           ← Permissions associées aux rôles
specialites           ← Spécialités médicales disponibles
factures              ← Facturation centres
logs                  ← Journal d'audit
otp_codes             ← Codes OTP temporaires
centre_inscriptions   ← Formulaires vitrine (inscription centre)
agent_candidatures    ← Formulaires vitrine (candidature agent)
```
