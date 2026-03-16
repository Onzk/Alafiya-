import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Initialisation de la base de données Alafiya Plus...')

  // Permissions système
  const permissions = await Promise.all([
    prisma.permission.upsert({ where: { code: 'create-patient' }, update: {}, create: { code: 'create-patient', description: 'Créer un dossier patient' } }),
    prisma.permission.upsert({ where: { code: 'read-dossier' }, update: {}, create: { code: 'read-dossier', description: 'Lire un dossier médical' } }),
    prisma.permission.upsert({ where: { code: 'write-dossier' }, update: {}, create: { code: 'write-dossier', description: 'Modifier un dossier médical' } }),
    prisma.permission.upsert({ where: { code: 'urgence-access' }, update: {}, create: { code: 'urgence-access', description: 'Activer le mode urgence' } }),
    prisma.permission.upsert({ where: { code: 'scan-qr' }, update: {}, create: { code: 'scan-qr', description: 'Scanner un QR code patient' } }),
    prisma.permission.upsert({ where: { code: 'create-user' }, update: {}, create: { code: 'create-user', description: 'Créer un compte utilisateur' } }),
    prisma.permission.upsert({ where: { code: 'manage-roles' }, update: {}, create: { code: 'manage-roles', description: 'Gérer les rôles et permissions' } }),
    prisma.permission.upsert({ where: { code: 'manage-centres' }, update: {}, create: { code: 'manage-centres', description: 'Gérer les centres de santé' } }),
    prisma.permission.upsert({ where: { code: 'manage-specialites' }, update: {}, create: { code: 'manage-specialites', description: 'Gérer les spécialités médicales' } }),
    prisma.permission.upsert({ where: { code: 'view-logs' }, update: {}, create: { code: 'view-logs', description: 'Consulter les journaux d\'activité' } }),
  ])
  console.log(`✓ ${permissions.length} permissions créées`)

  // Spécialités médicales
  const specialites = await Promise.all([
    prisma.specialite.upsert({ where: { code: 'MED_GEN' }, update: {}, create: { nom: 'Médecine Générale', code: 'MED_GEN', description: 'Médecine de premier recours' } }),
    prisma.specialite.upsert({ where: { code: 'PEDIATRIE' }, update: {}, create: { nom: 'Pédiatrie', code: 'PEDIATRIE', description: 'Médecine des enfants et adolescents' } }),
    prisma.specialite.upsert({ where: { code: 'GYNECO' }, update: {}, create: { nom: 'Gynécologie-Obstétrique', code: 'GYNECO', description: 'Santé de la femme et maternité' } }),
    prisma.specialite.upsert({ where: { code: 'CARDIO' }, update: {}, create: { nom: 'Cardiologie', code: 'CARDIO', description: 'Maladies du cœur et des vaisseaux' } }),
    prisma.specialite.upsert({ where: { code: 'CHIRURGIE' }, update: {}, create: { nom: 'Chirurgie Générale', code: 'CHIRURGIE', description: 'Interventions chirurgicales' } }),
    prisma.specialite.upsert({ where: { code: 'URGENCES' }, update: {}, create: { nom: 'Urgences', code: 'URGENCES', description: 'Médecine d\'urgence' } }),
    prisma.specialite.upsert({ where: { code: 'RADIO' }, update: {}, create: { nom: 'Radiologie', code: 'RADIO', description: 'Imagerie médicale' } }),
    prisma.specialite.upsert({ where: { code: 'LABO' }, update: {}, create: { nom: 'Laboratoire', code: 'LABO', description: 'Analyses biologiques' } }),
  ])
  console.log(`✓ ${specialites.length} spécialités créées`)

  // Compte Ministère
  const ministerePwd = await bcrypt.hash('AlafiyaMinistere2024!', 12)
  const ministere = await prisma.user.upsert({
    where: { email: 'admin@ministere-sante.tg' },
    update: {},
    create: {
      nom: 'MINISTÈRE',
      prenoms: 'de la Santé',
      email: 'admin@ministere-sante.tg',
      motDePasse: ministerePwd,
      niveauAcces: 'MINISTERE',
      estActif: true,
    },
  })
  console.log(`✓ Compte Ministère créé : admin@ministere-sante.tg`)

  // Centre de démonstration
  let centreDem = await prisma.centre.findFirst({ where: { nom: 'CHU Sylvanus Olympio' } })
  if (!centreDem) {
    const adminPwd = await bcrypt.hash('AdminCHU2024!', 12)

    centreDem = await prisma.centre.create({
      data: {
        nom: 'CHU Sylvanus Olympio',
        adresse: 'Avenue du 24 Janvier, Lomé',
        telephone: '+228 22 21 25 01',
        email: 'admin@chu-lomé.tg',
        region: 'Maritime',
        prefecture: 'Golfe',
        type: 'HOPITAL',
        estActif: true,
        creeParId: ministere.id,
      },
    })

    const adminCHU = await prisma.user.create({
      data: {
        nom: 'KOFFI',
        prenoms: 'Komlan',
        email: 'admin@chu-lomé.tg',
        motDePasse: adminPwd,
        niveauAcces: 'ADMIN_CENTRE',
        estActif: true,
        centreActifId: centreDem.id,
        creeParId: ministere.id,
        centres: { create: { centreId: centreDem.id } },
      },
    })

    await prisma.centre.update({
      where: { id: centreDem.id },
      data: { adminId: adminCHU.id },
    })

    console.log(`✓ Centre de démonstration créé : CHU Sylvanus Olympio`)
    console.log(`✓ Admin CHU créé : admin@chu-lomé.tg`)
  }

  console.log('\n✅ Base de données initialisée avec succès !')
  console.log('\n📋 Comptes de connexion :')
  console.log('  Ministère : admin@ministere-sante.tg / AlafiyaMinistere2024!')
  console.log('  Admin CHU : admin@chu-lomé.tg / AdminCHU2024!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
