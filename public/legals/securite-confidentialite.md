
**Dernière mise à jour : 22 mars 2026**


## Notre engagement

Les données médicales sont parmi les informations les plus sensibles
qui existent. Chez N'di Solutions, la sécurité n'est pas une option —
c'est le fondement sur lequel repose toute la confiance que vous nous
accordez. Cette page décrit concrètement les mesures techniques et
organisationnelles que nous mettons en œuvre pour protéger vos données.


## 1. Hébergement sur le territoire togolais

Toutes les données médicales collectées via Alafiya Plus sont hébergées
sur des serveurs physiques situés au Togo. Elles ne quittent jamais
le territoire national.

Ce choix n'est pas seulement une obligation légale — c'est une décision
délibérée pour garantir que vos données restent sous la juridiction
togolaise et sous le contrôle de N'di Solutions à tout moment.


## 2. Chiffrement des communications

Toutes les communications entre votre navigateur (ou votre appareil)
et les serveurs Alafiya Plus sont chiffrées via le protocole SSL/TLS.
Un certificat de sécurité valide est maintenu en permanence.

Cela signifie que toutes les données que vous envoyez ou recevez —
y compris les dossiers médicaux et les identifiants de connexion —
sont illisibles pour quiconque tenterait de les intercepter.


## 3. Protection des mots de passe

Les mots de passe des utilisateurs ne sont jamais stockés en clair
dans notre base de données. Ils sont systématiquement transformés via
un algorithme de hachage bcrypt, irréversible par nature.

Concrètement : même nos équipes techniques ne peuvent pas lire votre
mot de passe. En cas d'oubli, votre mot de passe ne peut pas être
récupéré — il doit être réinitialisé.


## 4. Contrôle d'accès strict

### Accès par rôle

Chaque utilisateur n'a accès qu'aux fonctionnalités correspondant
exactement à son rôle et à ses permissions. Un administrateur de centre
ne voit que les données de son établissement. Un professionnel de santé
ne voit que les dossiers de ses patients.

### Accès par spécialité médicale

Au sein d'un même dossier patient, chaque professionnel de santé n'accède
qu'aux modules correspondant à ses spécialités assignées. Un cardiologue
ne voit pas les données gynécologiques de son patient. La confidentialité
médicale est respectée à chaque niveau.

### Accès par QR code

L'accès au dossier d'un patient requiert la présentation physique de son
QR code. Sans ce QR code, aucun accès n'est possible en conditions normales.
Chaque accès est limité à une durée maximale d'une heure.


## 5. Traçabilité exhaustive

Chaque action sensible effectuée sur la plateforme est enregistrée de
manière permanente et inaltérable dans notre système de logs. Pour chaque
action, nous conservons :

— L'identité de l'utilisateur ayant effectué l'action
— Le type d'action réalisée
— La date et l'heure exactes (horodatage)
— Le centre de santé actif au moment de l'action
— L'adresse IP et le navigateur utilisés

Les actions tracées incluent notamment : chaque connexion et déconnexion,
chaque scan de QR code, chaque accès à un dossier médical, chaque
modification de dossier, chaque activation du mode urgence, chaque
création de compte ou de centre.

Cette traçabilité protège à la fois les patients (contre les accès
non autorisés) et les professionnels de santé (contre les accusations
non fondées).


## 6. Mode urgence encadré

Le mode urgence, qui permet l'accès au dossier complet sans QR code
en situation critique, fait l'objet d'un encadrement strict :

— Justification écrite obligatoire avant activation
— Notification automatique à la personne à prévenir du patient
— Traçabilité complète dans un registre dédié
— Obligation de justification a posteriori par le patient ou
  sa personne à prévenir

Toute activation injustifiée est détectable et sanctionnable.


## 7. Sauvegardes automatiques

Les données hébergées sur nos serveurs font l'objet de sauvegardes
automatiques régulières. En cas d'incident technique, la restauration
des données peut être effectuée rapidement pour garantir la continuité
du service.


## 8. Authentification sécurisée

La plateforme utilise NextAuth.js avec une stratégie JWT (JSON Web Token).
Chaque session est associée à un token signé, limité dans le temps, et
invalidé automatiquement à la déconnexion. L'ensemble des routes de
l'application est protégé par un middleware de vérification du token
et du niveau d'accès.


## 9. Intelligence artificielle locale

Le module de dictée vocale et de structuration automatique par IA utilise
des modèles hébergés localement sur nos serveurs (Whisper et Phi-3 Mini
via Ollama). Les enregistrements audio et les transcriptions ne sont
jamais envoyés à des services cloud externes tiers.

Vos données médicales ne transitent pas par des API d'intelligence
artificielle externes.


## 10. Vos droits en matière de sécurité

Si vous suspectez un accès non autorisé à votre dossier médical ou
à votre compte, contactez-nous immédiatement à :
security@alafiyaplus.tg

Nous nous engageons à traiter toute alerte de sécurité dans les
meilleurs délais et à vous informer des suites données.

Vous pouvez également saisir l'Instance de Protection des Données
à Caractère Personnel (IPDCP) du Togo pour toute réclamation relative
à la protection de vos données : ipdcp.tg


## 11. Amélioration continue

La sécurité est un processus continu. N'di Solutions s'engage à :

— Effectuer des audits de sécurité réguliers de la plateforme
— Appliquer les mises à jour de sécurité sans délai
— Former les équipes internes aux bonnes pratiques de sécurité
— Documenter et améliorer en permanence les procédures de gestion
  des incidents


## Contact sécurité

Pour signaler une vulnérabilité ou un incident de sécurité :

N'di Solutions — Équipe Sécurité
Email : security@alafiyaplus.tg
Adresse : Lomé, Togo