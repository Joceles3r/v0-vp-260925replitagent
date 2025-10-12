#!/usr/bin/env node

/**
 * Script de génération d'OTP admin d'urgence
 * 
 * USAGE: node scripts/generate-admin-otp.js [EMAIL_ADMIN]
 * 
 * Ce script génère un OTP temporaire de 10 minutes pour accès admin d'urgence.
 * Utilisez-le uniquement en cas de perte d'accès 2FA ou lors du déploiement initial.
 */

const adminEmail = process.argv[2] || 'visual@replit.com';
const serverSecret = process.env.ADMIN_CONSOLE_SECRET || 'dev_secret_change_me';

console.log('🚨 GÉNÉRATION OTP ADMIN D\'URGENCE 🚨');
console.log('=====================================');

async function generateAdminOtp() {
  try {
    const response = await fetch('http://localhost:5000/api/admin/break-glass/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adminEmail,
        secret: serverSecret
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ OTP GÉNÉRÉ AVEC SUCCÈS !');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`⏰ Expire: ${result.expiresAt}`);
      console.log(`🕒 Durée: 10 minutes`);
      console.log('');
      console.log('📋 PROCÉDURE D\'ACCÈS:');
      console.log('1. Allez sur: http://localhost:5000 (ou votre domaine)');
      console.log('2. Cliquez sur "Accès Admin" ou allez sur /admin');
      console.log('3. Entrez votre email admin');
      console.log('4. Entrez l\'OTP affiché dans la console serveur');
      console.log('5. Une fois connecté, configurez votre 2FA si pas encore fait');
    } else {
      console.error('❌ ERREUR:', result.error);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ ERREUR DE CONNEXION:', error.message);
    console.log('');
    console.log('🔧 VÉRIFICATIONS:');
    console.log('- Le serveur VISUAL est-il démarré ? (npm run dev)');
    console.log('- Le port 5000 est-il accessible ?');
    console.log('- Les variables d\'environnement sont-elles configurées ?');
    process.exit(1);
  }
}

// Vérifications préalables
if (!adminEmail.includes('@')) {
  console.error('❌ Email admin invalide:', adminEmail);
  console.log('Usage: node scripts/generate-admin-otp.js admin@example.com');
  process.exit(1);
}

console.log(`📧 Email admin: ${adminEmail}`);
console.log(`🔐 Secret serveur: ${serverSecret.substring(0, 8)}...`);
console.log('');

generateAdminOtp();
