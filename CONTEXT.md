# Cahier des charges — Alafiya Plus

## 1. Présentation du projet

Alafiya Plus est une application web PWA (Progressive Web App) responsive,
développée pour le Togo, permettant de centraliser et sécuriser les dossiers
médicaux des patients à l'échelle nationale. L'interface est entièrement en
français. La plateforme utilise l'intelligence artificielle pour faciliter la
saisie des informations médicales par les professionnels de santé, et un QR
code sécurisé attribué à chaque patient pour un accès rapide et contrôlé à
son dossier médical.

L'objectif est de simplifier l'accès aux dossiers médicaux, d'améliorer la
continuité des soins entre les établissements de santé, et de réduire les
erreurs médicales liées à un manque d'information.

La stack technique est la suivante : Next.js 14 (App Router), MongoDB avec
Mongoose, Tailwind CSS, shadcn/ui pour les composants, et NextAuth.js v5 avec
JWT pour l'authentification.

---

## 2. Gouvernance et hiérarchie du système

La plateforme est gouvernée au niveau national par le Ministère de la Santé
du Togo, qui constitue l'autorité centrale du système. Le Ministère administre
la plateforme, assure la sécurité des données, gère l'infrastructure, crée les
comptes des centres de santé, et définit les rôles globaux ainsi que les
permissions associées. Les permissions sont des actions précises telles que
créer un patient, lire un dossier médical, activer le mode urgence, etc.

Sous le Ministère se trouvent les centres de santé (hôpitaux, cliniques,
centres de santé urbains, centres médicaux sociaux). À la création d'un centre
par le Ministère, un compte administrateur est automatiquement généré pour ce
centre. Cet administrateur peut ensuite créer les comptes des professionnels
de santé de son établissement en leur assignant des rôles et des spécialités
médicales. Un professionnel de santé peut être affecté à plusieurs centres de
santé. À chaque connexion, il doit choisir le centre sur lequel il travaille
pour la session en cours.

Il existe donc trois niveaux d'accès distincts dans le système : le niveau
Ministère (super administrateur national), le niveau Administrateur de centre
(gestionnaire d'un établissement), et le niveau Personnel médical (médecin,
infirmier, paramédical, etc.).

---

## 3. Site vitrine

La route racine `/` du projet héberge le site vitrine public d'Alafiya Plus.
Ce site présente la plateforme aux établissements de santé et aux décideurs.
Il comprend une landing page avec un hero percutant, une section de
présentation des fonctionnalités clés, une section expliquant le fonctionnement
pas à pas, une section sur la sécurité des données, une section "Pour qui",
et une page de contact. Le design est médical et professionnel, avec une
palette dominante vert, blanc et bleu. Le site est entièrement responsive et
mobile-first. Un bouton "Connexion" dans le header redirige vers `/login`.

---

## 4. Authentification

L'authentification est gérée par NextAuth.js v5 avec une stratégie JWT.
La page de connexion se trouve à la route `/login` et demande un email et un
mot de passe. Les mots de passe sont stockés hashés avec bcryptjs. Toutes les
routes de l'application protégée sont sécurisées par un middleware Next.js qui
vérifie le token JWT et le niveau d'accès de l'utilisateur.

Après connexion, si le professionnel est affecté à plusieurs centres de santé,
une modale de sélection du centre actif s'affiche avant toute redirection. La
redirection post-connexion dépend du niveau d'accès : le Ministère est redirigé
vers son tableau de bord national, l'administrateur de centre vers son tableau
de bord d'établissement, et le personnel médical vers son tableau de bord
personnel.

---

## 5. Gestion des patients et dossiers médicaux

### 5.1 Création d'un patient

Toute personne disposant de la permission appropriée peut créer un dossier
patient. Les données obligatoires à collecter sont le nom, les prénoms, le
genre (M ou F), la date de naissance (avec indication si elle est présumée ou
non), l'adresse du patient, et les informations complètes d'une personne à
prévenir en cas d'urgence (nom, prénoms, téléphone, adresse, relation avec le
patient). Cette personne à prévenir est obligatoire pour tous les patients sans
exception.

Les données optionnelles sont le numéro de téléphone du patient, son adresse
email, et son numéro de carte nationale d'identité.

À la création du dossier, un QR code sécurisé est automatiquement généré. Ce
QR code est basé sur un token unique (UUID v4 hashé) associé au patient dans
la base de données. Il peut être imprimé ou affiché sur mobile.

### 5.2 Structure d'un enregistrement médical

Chaque consultation donne lieu à un enregistrement médical structuré selon le
modèle suivant, qui est la structure de référence du système :

- Antécédents médicaux du patient
- Signes et symptômes constatés lors de la consultation
- Examens effectués
- Bilan et analyses
- Traitements prescrits, subdivisés en trois parties : conseils donnés au
  patient, injections administrées, et ordonnance médicale
- Suivi préconisé (contrôle à prévoir, examens complémentaires à réaliser
  avant la prochaine consultation, etc.)

### 5.3 Accès au dossier via QR code

Lorsqu'un patient arrive dans un établissement de santé, le professionnel
scanne son QR code depuis l'application. Le système identifie le patient et
déclenche un processus de validation d'accès.

Si le patient possède un numéro de téléphone enregistré dans son dossier, un
code OTP à usage unique est envoyé par SMS via l'API AfrikSMS. Le patient
communique oralement ce code au professionnel, qui le saisit dans l'interface.
Une fois le code validé, l'accès au dossier est ouvert pour une durée maximale
d'une heure.

Si le patient n'a pas de numéro de téléphone enregistré, un écran de signature
numérique sur fond blanc lui est présenté. Sa signature manuscrite sur l'écran
du terminal vaut consentement. L'accès est alors accordé dans les mêmes
conditions temporelles.

### 5.4 Accès par modules médicaux et spécialités

Le dossier médical est organisé en modules correspondant aux spécialités
médicales définies par le Ministère. Après validation de l'accès, le
professionnel de santé choisit une spécialité parmi celles qui lui ont été
assignées par l'administrateur de son centre. Il accède uniquement au module
correspondant à cette spécialité, ce qui protège la confidentialité des données
du patient dans les autres domaines médicaux.

Par exemple, un médecin généraliste accède au module de médecine générale, un
gynécologue au module gynécologique, un cardiologue au module cardiologique.
Chaque module affiche les enregistrements précédents dans cette spécialité et
permet d'en créer un nouveau.

---

## 6. Dictée vocale et structuration par IA

Pour réduire le temps de saisie des professionnels de santé, l'application
intègre une fonction de dictée vocale intelligente directement dans le
formulaire d'enregistrement médical.

Le médecin active l'enregistrement audio depuis l'interface. Il dicte librement
ses observations de consultation à voix haute. L'enregistrement est ensuite
envoyé à une API route interne qui le transmet à une instance Whisper tiny
hébergée localement via Ollama (à l'adresse `http://localhost:11434`). Whisper
transcrit l'audio en texte brut.

Ce texte brut est ensuite transmis au modèle Phi-3 Mini, également hébergé
localement via Ollama, avec un prompt système lui demandant d'analyser le texte
et de le structurer en JSON selon les six champs de la structure médicale de
référence (antécédents, signes, examens, bilan, traitements avec
sous-champs, suivi). Le modèle doit répondre uniquement en JSON valide sans
aucun texte autour.

Le formulaire est ensuite pré-rempli automatiquement avec les données
structurées. Le médecin relit, corrige si nécessaire, et valide le contenu.
L'enregistrement n'est sauvegardé dans le dossier médical qu'après validation
explicite du médecin. Le texte brut de la transcription est également conservé
dans la base de données à des fins de traçabilité.

---

## 7. Mode urgence

Le mode urgence permet à un professionnel de santé d'accéder au dossier complet
d'un patient, toutes spécialités confondues, sans nécessiter l'autorisation
préalable du patient par OTP ou signature. Il est réservé aux situations où
le patient est dans un état critique et ne peut pas donner son consentement.

L'activation du mode urgence est accessible depuis l'interface de scan QR code.
Elle nécessite obligatoirement une justification écrite saisie par le
professionnel dans l'interface. Un SMS de notification est automatiquement
envoyé via AfrikSMS à la personne à prévenir enregistrée dans le dossier du
patient.

Chaque activation du mode urgence doit faire l'objet d'une justification
a posteriori, soit par le patient lui-même lorsqu'il sera en état de le faire,
soit par sa personne à prévenir. Cette justification peut prendre la forme
d'une signature numérique dans l'application ou d'une confirmation par SMS.
Toutes les activations du mode urgence sont enregistrées dans une collection
dédiée de la base de données avec l'identité du professionnel, l'heure d'accès,
la justification, et les informations du validateur.

---

## 8. Système de logs

Absolument toutes les actions sensibles du système doivent être loggées sans
exception dans une collection de logs dédiée. Chaque entrée de log contient
l'identifiant de l'utilisateur ayant effectué l'action, le type d'action, la
cible de l'action (collection et identifiant de l'objet concerné), le centre
de santé actif, des détails contextuels en format JSON libre, l'adresse IP,
et le user-agent du navigateur.

Les actions à logger obligatoirement sont les suivantes : connexion, 
déconnexion, scan d'un QR code, envoi d'un OTP, validation d'un OTP, accès à
un dossier médical, modification d'un dossier médical, activation du mode
urgence, création d'un patient, création d'un compte utilisateur, création
d'un centre de santé, création d'un rôle, et toute modification de permissions.

---

## 9. Tableaux de bord

### Tableau de bord Ministère
Le tableau de bord du Ministère offre une vue nationale de la plateforme. Il
affiche des statistiques globales (nombre de centres actifs, nombre de patients
enregistrés, nombre de consultations). Il permet de gérer la liste des centres
de santé (création, activation, désactivation), de gérer les spécialités
médicales disponibles dans le système, de gérer les rôles globaux et les
permissions associées.

### Tableau de bord Administrateur de centre
Le tableau de bord de l'administrateur d'un centre affiche les statistiques
de son établissement. Il lui permet de gérer la liste des professionnels de
santé de son centre (création de comptes, assignation de rôles, assignation
de spécialités, activation/désactivation). Il peut également consulter les
logs d'activité de son centre.

### Tableau de bord Personnel médical
Le tableau de bord du personnel médical affiche la liste de ses patients
récents et les dernières consultations effectuées. Un accès rapide au scanner
QR code est mis en avant. Le professionnel peut également rechercher un patient
par nom ou numéro de dossier.

---

## 10. Variables d'environnement

Le fichier `.env.example` doit contenir les variables suivantes :
`MONGODB_URI` pour la connexion à la base de données MongoDB, `NEXTAUTH_SECRET`
et `NEXTAUTH_URL` pour NextAuth.js, `AFRIKSMS_API_KEY` et `AFRIKSMS_SENDER`
(valeur : AlafiyaPlus) pour l'envoi de SMS, `OLLAMA_BASE_URL` (valeur par
défaut : `http://localhost:11434`) pour le serveur IA local, et
`NEXT_PUBLIC_APP_NAME` (valeur : Alafiya Plus) pour le nom affiché dans
l'interface.

---

## 11. Documentation technique

Un fichier `README.md` doit être généré à la racine du projet. Il doit
expliquer les prérequis d'installation, les étapes pour lancer le projet en
développement, et les instructions pour configurer le serveur Ollama local
avec les modèles Whisper tiny et Phi-3 Mini, notamment les commandes
`ollama pull` correspondantes et la configuration des endpoints utilisés par
l'application.