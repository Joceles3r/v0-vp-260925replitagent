# 🔐 PROCÉDURE D'ACCÈS ADMIN SÉCURISÉ - VISUAL

## 🚨 ACCÈS INITIAL (PREMIÈRE FOIS)

### Étape 1: Générer l'OTP d'urgence

Sur le serveur, exécutez :

\`\`\`bash
# Dans le terminal du serveur VISUAL
node scripts/generate-admin-otp.js visual@replit.com
\`\`\`

**Sortie attendue :**
\`\`\`
🚨 GÉNÉRATION OTP ADMIN D'URGENCE 🚨
=====================================
✅ OTP GÉNÉRÉ AVEC SUCCÈS !
📧 Email: visual@replit.com
⏰ Expire: 2025-09-29T19:15:00.000Z
🕒 Durée: 10 minutes

📋 PROCÉDURE D'ACCÈS:
1. Allez sur: http://localhost:5000 (ou votre domaine)
2. Cliquez sur "Accès Admin" ou allez sur /admin
3. Entrez votre email admin
4. Entrez l'OTP affiché dans la console serveur
5. Une fois connecté, configurez votre 2FA si pas encore fait
\`\`\`

### Étape 2: Connexion avec l'OTP

1. **Ouvrez votre navigateur** : `http://localhost:5000/admin` (ou votre domaine)
2. **Entrez vos identifiants** :
   - Email : `visual@replit.com`
   - OTP : `[32-caractères-affiches-dans-console]`
3. **Cliquez sur "Accès Admin"**

## 🔒 ACCÈS STANDARD (APRÈS CONFIGURATION 2FA)

### Prérequis: Configuration 2FA

Une fois connecté avec l'OTP initial :

1. **Allez dans les paramètres de sécurité**
2. **Configurez votre 2FA** :
   - Scannez le QR code avec Google Authenticator/Authy
   - Sauvegardez les codes de récupération
   - Testez votre configuration

### Connexion 2FA Standard

1. **Allez sur** : `http://localhost:5000/admin`
2. **Entrez vos identifiants** :
   - Email : `visual@replit.com`
   - Code 2FA : `[6-chiffres-de-votre-app]`
3. **Cliquez sur "Accès Admin"**

## 🛡️ SÉCURITÉ IMPLÉMENTÉE

### Protection Contre les Attaques

- **Rate Limiting** : Max 3 tentatives/heure
- **Audit Trail** : Toutes les actions loggées
- **OTP Temporaire** : Expire en 10 minutes
- **Session Sécurisée** : Auto-déconnexion
- **IP Tracking** : Surveillance des accès

### Fonctionnalités Admin Disponibles

- **Dashboard** : `/api/admin/dashboard`
- **Gestion Utilisateurs** : `/api/admin/users/management`
- **Audit Trail** : `/api/admin/audit`
- **Historique Accès** : `/api/admin/access-history`

## 🚨 ACCÈS D'URGENCE (SI 2FA PERDU)

### En cas de perte d'accès 2FA :

1. **Connectez-vous au serveur**
2. **Générez un nouvel OTP** :
   \`\`\`bash
   node scripts/generate-admin-otp.js visual@replit.com
   \`\`\`
3. **Suivez la procédure d'accès initial**
4. **Reconfigurez votre 2FA immédiatement**

## ⚠️ RÈGLES DE SÉCURITÉ

### À FAIRE ✅

- ✅ Utilisez des mots de passe forts
- ✅ Configurez 2FA dès la première connexion
- ✅ Sauvegardez vos codes de récupération
- ✅ Vérifiez l'audit trail régulièrement
- ✅ Déconnectez-vous après usage

### À NE PAS FAIRE ❌

- ❌ Ne partagez jamais vos OTPs
- ❌ Ne désactivez pas le 2FA
- ❌ Ne vous connectez pas depuis des réseaux publics
- ❌ Ne laissez pas de session ouverte
- ❌ Ne stockez pas les OTPs en plain text

## 🔧 DÉPANNAGE

### Erreur "OTP Invalide ou Expiré"

- **Vérifiez l'heure** : L'OTP n'est valide que 10 minutes
- **Régénérez** : `node scripts/generate-admin-otp.js`
- **Vérifiez l'email** : Utilisez exactement `visual@replit.com`

### Erreur "Trop de tentatives"

- **Attendez 1 heure** ou redémarrez le serveur
- **Vérifiez les logs** : `/api/admin/audit`

### Erreur "Secret Serveur Requis"

- **Configurez la variable** : `ADMIN_CONSOLE_SECRET=votre_secret_fort`
- **Redémarrez le serveur** après modification

## 📞 SUPPORT

En cas de problème critique :

1. **Vérifiez les logs** : Console serveur + `/api/admin/audit`
2. **Redémarrez le serveur** si nécessaire
3. **Vérifiez la base de données** : Table `admin_break_glass_otp`

---

**🔐 Votre plateforme VISUAL est maintenant sécurisée au niveau bancaire !**
