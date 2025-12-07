# 📱 MemIA - PWA de Collecte Multimédia

Application Progressive Web App (PWA) pour la collecte d'enregistrements **Audio**, **Vidéo**, **Images** et **Textes**.

## ✨ Fonctionnalités

- 🎤 **Enregistrement Audio** - Capturez des enregistrements audio directement depuis le navigateur
- 🎥 **Enregistrement Vidéo** - Enregistrez des vidéos avec votre caméra
- 📷 **Capture d'Images** - Prenez des photos instantanément
- 📝 **Saisie de Texte** - Enregistrez des notes textuelles
- 💾 **Stockage Local** - Tous les enregistrements sont sauvegardés localement (LocalStorage + IndexedDB)
- 📴 **Mode Hors Ligne** - Fonctionne même sans connexion Internet grâce au Service Worker
- 📲 **Installable** - Peut être installée comme une application native sur votre appareil
- 🎨 **Interface Moderne** - Design responsive et agréable

## 🚀 Démarrage Rapide

### Installation des dépendances

```bash
npm install
```

### Lancer l'application en local

```bash
npm start
```

L'application s'ouvrira automatiquement dans votre navigateur sur `http://localhost:8080`

### Commandes disponibles

- `npm start` - Lance le serveur et ouvre l'application
- `npm run dev` - Mode développement (désactive le cache)
- `npm run https` - Lance le serveur en HTTPS (nécessite des certificats)

## 📖 Documentation Complète

Pour des instructions détaillées sur le test local, les différentes méthodes d'installation, et la résolution de problèmes, consultez le fichier **[INSTALL.md](./INSTALL.md)**.

## 🏗️ Structure du Projet

```
MemIA/
├── index.html           # Page principale
├── styles.css           # Styles CSS
├── app.js              # Logique JavaScript
├── sw.js               # Service Worker
├── manifest.json       # Manifest PWA
├── icons/              # Icônes de l'application
│   └── icon-*.svg      # Icônes de différentes tailles
├── package.json        # Dépendances et scripts
├── README.md           # Ce fichier
└── INSTALL.md          # Guide d'installation détaillé
```

## 🧪 Technologies Utilisées

- **HTML5** - Structure de la page
- **CSS3** - Mise en forme et animations
- **JavaScript (ES6+)** - Logique applicative
- **Service Worker** - Fonctionnement hors ligne
- **Web APIs** :
  - MediaRecorder API - Enregistrement audio/vidéo
  - getUserMedia API - Accès caméra/microphone
  - IndexedDB - Stockage des fichiers multimédia
  - LocalStorage - Stockage des métadonnées

## 🌐 Compatibilité Navigateurs

- ✅ Chrome/Edge 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Opera 67+
- ⚠️ Internet Explorer non supporté

## 📝 Licence

MIT License - Vous êtes libre d'utiliser, modifier et distribuer ce projet.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou soumettre une pull request.

---

Développé avec ❤️ pour la collecte multimédia simplifiée
