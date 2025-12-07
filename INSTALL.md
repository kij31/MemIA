# 🚀 Guide d'Installation et Test Local - MemIA PWA

Ce guide vous explique comment tester le PWA MemIA sur votre PC local avant sa publication.

## 📋 Prérequis

- **Node.js** (version 14 ou supérieure) - [Télécharger Node.js](https://nodejs.org/)
- Un navigateur moderne (Chrome, Firefox, Edge, ou Safari)
- Un éditeur de code (VS Code, Sublime Text, etc.) - optionnel

## 🔧 Installation

### Option 1 : Avec un serveur HTTP simple (Recommandé)

1. **Ouvrez un terminal dans le dossier du projet**
   ```bash
   cd /chemin/vers/MemIA
   ```

2. **Installez un serveur HTTP global (une seule fois)**
   ```bash
   npm install -g http-server
   ```

3. **Lancez le serveur**
   ```bash
   http-server -p 8080
   ```

4. **Ouvrez votre navigateur**
   - Allez sur : `http://localhost:8080`
   - L'application devrait s'afficher !

### Option 2 : Avec Python (si vous avez Python installé)

1. **Ouvrez un terminal dans le dossier du projet**
   ```bash
   cd /chemin/vers/MemIA
   ```

2. **Lancez le serveur Python**

   Pour Python 3 :
   ```bash
   python3 -m http.server 8080
   ```

   Pour Python 2 :
   ```bash
   python -m SimpleHTTPServer 8080
   ```

3. **Ouvrez votre navigateur**
   - Allez sur : `http://localhost:8080`

### Option 3 : Avec l'extension Live Server (VS Code)

1. **Installez l'extension "Live Server"** dans VS Code
2. **Ouvrez le dossier du projet** dans VS Code
3. **Clic droit sur `index.html`** → "Open with Live Server"
4. Le navigateur s'ouvre automatiquement !

## 🧪 Test des Fonctionnalités PWA

### 1. Test des fonctionnalités de base

Une fois l'application ouverte dans le navigateur :

- ✅ **Audio** : Cliquez sur "Enregistrer Audio" (autorisez le microphone)
- ✅ **Vidéo** : Cliquez sur "Enregistrer Vidéo" (autorisez la caméra et le microphone)
- ✅ **Image** : Cliquez sur "Prendre une Photo" (autorisez la caméra)
- ✅ **Texte** : Entrez du texte et cliquez sur "Sauvegarder Texte"
- ✅ **Liste** : Vérifiez que vos enregistrements apparaissent en bas

### 2. Test du Service Worker

1. **Ouvrez les outils de développement** (F12 dans la plupart des navigateurs)
2. Allez dans l'onglet **"Application"** (Chrome) ou **"Storage"** (Firefox)
3. Dans la section **"Service Workers"**, vous devriez voir le service worker enregistré
4. **Testez le mode hors ligne** :
   - Cochez "Offline" dans les DevTools
   - Rechargez la page
   - L'application devrait toujours fonctionner !

### 3. Test de l'installation PWA

#### Sur Chrome/Edge Desktop :

1. Ouvrez l'application sur `http://localhost:8080`
2. Cherchez l'icône **"Installer"** dans la barre d'adresse (à droite)
3. Cliquez dessus et confirmez l'installation
4. L'application s'ouvrira comme une app native !

#### Sur Chrome Mobile :

1. Ouvrez l'application sur votre mobile
2. Un bandeau "Ajouter à l'écran d'accueil" devrait apparaître
3. Cliquez dessus et confirmez
4. L'icône apparaîtra sur votre écran d'accueil !

### 4. Test des permissions

L'application demande les permissions suivantes :

- 🎤 **Microphone** - pour l'enregistrement audio
- 📹 **Caméra** - pour l'enregistrement vidéo et les photos
- 💾 **Stockage** - pour sauvegarder les enregistrements

**Note** : Sur certains navigateurs, HTTPS est requis pour accéder à la caméra/microphone. Si vous rencontrez des problèmes, consultez la section "HTTPS Local" ci-dessous.

## 🔒 Tester avec HTTPS en local

Pour un test plus réaliste (et pour que toutes les permissions fonctionnent), vous pouvez utiliser HTTPS localement :

### Méthode 1 : Avec http-server

```bash
npm install -g http-server
http-server -S -C cert.pem -K key.pem -p 8080
```

### Méthode 2 : Avec ngrok (tunnel HTTPS)

1. **Installez ngrok** : [https://ngrok.com/download](https://ngrok.com/download)
2. **Lancez votre serveur local** sur le port 8080
3. **Créez un tunnel** :
   ```bash
   ngrok http 8080
   ```
4. **Utilisez l'URL HTTPS** fournie par ngrok (ex: `https://xyz.ngrok.io`)

### Méthode 3 : Avec mkcert (Certificat SSL local)

1. **Installez mkcert** : [https://github.com/FiloSottile/mkcert](https://github.com/FiloSottile/mkcert)
2. **Créez un certificat local** :
   ```bash
   mkcert -install
   mkcert localhost
   ```
3. **Utilisez le certificat avec votre serveur**

## 📱 Test sur Mobile

Pour tester sur votre téléphone mobile :

### Via le réseau local :

1. **Trouvez l'adresse IP de votre PC** :
   - Windows : `ipconfig`
   - Mac/Linux : `ifconfig` ou `ip addr`

2. **Lancez le serveur** sur votre PC (port 8080)

3. **Sur votre mobile**, connectez-vous au même réseau WiFi

4. **Ouvrez le navigateur mobile** et allez sur :
   ```
   http://[ADRESSE-IP-DE-VOTRE-PC]:8080
   ```
   Exemple : `http://192.168.1.100:8080`

### Via ngrok (plus simple) :

1. Lancez ngrok comme indiqué ci-dessus
2. Utilisez l'URL HTTPS sur votre mobile
3. Pas besoin d'être sur le même réseau !

## 🐛 Résolution de Problèmes

### Le service worker ne s'enregistre pas
- Vérifiez la console (F12) pour voir les erreurs
- Assurez-vous que le fichier `sw.js` est accessible
- Essayez en mode incognito

### Les permissions caméra/micro sont refusées
- Utilisez HTTPS (localhost est accepté par défaut)
- Vérifiez les paramètres de votre navigateur
- Sur Chrome : chrome://settings/content

### L'installation PWA n'est pas proposée
- Vérifiez que le manifest.json est valide
- Assurez-vous d'avoir un service worker actif
- Utilisez HTTPS ou localhost
- Testez avec Chrome DevTools → Application → Manifest

### Les enregistrements ne se sauvegardent pas
- Vérifiez la console pour les erreurs IndexedDB
- Essayez de vider le cache et le stockage
- Chrome DevTools → Application → Clear storage

## 📊 Outils de Développement Utiles

### Chrome DevTools - Application Tab

- **Manifest** : Vérifiez que le manifest.json est valide
- **Service Workers** : État du service worker
- **Storage** :
  - Local Storage : données texte simples
  - IndexedDB : fichiers audio/vidéo/images
- **Cache Storage** : fichiers mis en cache

### Lighthouse (Audit PWA)

1. Ouvrez Chrome DevTools (F12)
2. Allez dans l'onglet **"Lighthouse"**
3. Sélectionnez "Progressive Web App"
4. Cliquez sur **"Generate report"**
5. Vous obtiendrez un score et des recommandations !

## 🎯 Checklist avant Publication

Avant de publier votre PWA, vérifiez que :

- ✅ Le service worker fonctionne correctement
- ✅ Le manifest.json est valide
- ✅ Les icônes sont bien chargées (toutes les tailles)
- ✅ L'application fonctionne hors ligne
- ✅ Les permissions sont correctement gérées
- ✅ Le score Lighthouse PWA est > 90
- ✅ L'application est responsive (mobile/tablette/desktop)
- ✅ HTTPS est configuré pour la production

## 📚 Ressources Supplémentaires

- [MDN - Progressive Web Apps](https://developer.mozilla.org/fr/docs/Web/Progressive_web_apps)
- [web.dev - PWA](https://web.dev/progressive-web-apps/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Can I Use - Service Workers](https://caniuse.com/serviceworkers)

## 🆘 Besoin d'Aide ?

Si vous rencontrez des problèmes :

1. Vérifiez la console du navigateur (F12)
2. Consultez l'onglet Application dans les DevTools
3. Testez dans un autre navigateur
4. Essayez en mode incognito
5. Vérifiez que tous les fichiers sont bien présents

Bon test ! 🚀
