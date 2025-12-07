# 💜 Soussou Souvenirs - PWA

Application Progressive Web App (PWA) pour la collecte de souvenirs multimédia destinée aux personnes atteintes d'Alzheimer et leurs proches.

## 📖 Description

**Soussou Souvenirs** permet aux familles et amis de créer, partager et synchroniser des souvenirs multimédia (photos, vidéos, audios, textes) avec des métadonnées riches pour constituer un dataset familial précieux.

### Fonctionnalités principales

- ✅ **Capture multimédia** : Photos, vidéos, audios et textes
- ✅ **Métadonnées riches** : Auteur, relation, date, lieu, émotion, personnes, catégorie, description
- ✅ **Mode hors ligne** : Fonctionne sans connexion Internet
- ✅ **Synchronisation automatique** : Envoi vers n8n webhook quand en ligne
- ✅ **Compression des médias** : Optimisation automatique (WebP, redimensionnement)
- ✅ **Stockage illimité** : IndexedDB (au-delà des 5MB de localStorage)
- ✅ **Authentification** : Protection par clé secrète (optionnelle)
- ✅ **Installable** : PWA installable sur mobile et desktop
- ✅ **Design responsive** : Mobile-first, élégant et accessible

## 🚀 Installation

### Prérequis

- Node.js >= 18.0.0
- npm ou yarn

### Étapes

1. **Cloner le repository**
```bash
git clone <votre-repo>
cd soussou-souvenirs-pwa
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
```

Éditer `.env` et configurer :
```env
VITE_N8N_WEBHOOK_URL=https://votre-n8n.com/webhook/soussou-souvenirs
VITE_APP_SECRET_KEY=VOTRE_CLE_FAMILLE
VITE_MAX_FILE_SIZE=52428800
```

4. **Lancer en développement**
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 🏗️ Build & Déploiement

### Build production

```bash
npm run build
```

Les fichiers optimisés seront dans le dossier `dist/`

### Prévisualiser le build

```bash
npm run preview
```

### Déploiement

#### Option 1 : Netlify

1. Connecter votre repository GitHub à Netlify
2. Configurer les variables d'environnement dans Netlify
3. Build command : `npm run build`
4. Publish directory : `dist`

#### Option 2 : Vercel

```bash
npm install -g vercel
vercel
```

Suivre les instructions et configurer les variables d'environnement dans le dashboard Vercel.

#### Option 3 : Serveur statique (Nginx, Apache)

1. Builder : `npm run build`
2. Uploader le contenu de `dist/` vers votre serveur
3. Configurer HTTPS (obligatoire pour PWA)
4. Configurer les variables d'environnement côté serveur

**Exemple Nginx :**
```nginx
server {
    listen 443 ssl http2;
    server_name souvenirs.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/soussou-souvenirs/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache des assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker (ne pas cacher)
    location /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

## 🔧 Configuration n8n

### Créer le workflow n8n

1. **Créer un nouveau workflow**
2. **Ajouter un nœud Webhook**
   - Method: POST
   - Path: `/webhook/soussou-souvenirs`
   - Response Code: 200

3. **Traiter le JSON reçu**

Structure du payload :
```json
{
  "id": "1234567890-abc123",
  "mediaType": "photo|video|audio|text",
  "mediaBase64": "data:image/jpeg;base64,...",
  "author": "Marie",
  "relationship": "enfant",
  "dateRange": "Été 1985",
  "location": "Maison de campagne",
  "emotion": "joyeux",
  "people": "Maman, Papa",
  "description": "Vacances à la mer...",
  "category": "vacances",
  "timestamp": 1234567890000,
  "status": "validated"
}
```

4. **Exemple de workflow n8n**

```
Webhook → Function (Extract Base64) → Binary → File Writer → Database Insert → Email Notification
```

**Node Function (Extraction média) :**
```javascript
// Décoder base64 et créer un fichier
const base64Data = items[0].json.mediaBase64;
const buffer = Buffer.from(base64Data.split(',')[1], 'base64');

// Déterminer l'extension
const mimeType = base64Data.split(';')[0].split(':')[1];
const ext = mimeType.split('/')[1];

// Nom du fichier
const filename = `${items[0].json.id}.${ext}`;

return {
  json: items[0].json,
  binary: {
    data: {
      data: buffer,
      mimeType: mimeType,
      fileName: filename
    }
  }
};
```

**Node Write Binary File :**
- Input Binary Field: `data`
- File Name: `={{ $json.id }}.{{ $json.mediaType === 'photo' ? 'jpg' : $json.mediaType }}`
- Destination Path: `/path/to/storage/souvenirs/`

**Node PostgreSQL/MySQL :**
```sql
INSERT INTO souvenirs
  (id, media_path, media_type, author, relationship, date_range, location,
   emotion, people, description, category, timestamp, created_at)
VALUES
  (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
```

**Node Email (optionnel) :**
- To: admin@example.com
- Subject: Nouveau souvenir de {{ $json.author }}
- Body: Template avec les détails

5. **Activer le workflow** et récupérer l'URL du webhook

6. **Tester** avec curl :
```bash
curl -X POST https://your-n8n.com/webhook/soussou-souvenirs \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-123",
    "mediaType": "text",
    "mediaBase64": "data:text/plain;base64,SGVsbG8gV29ybGQ=",
    "author": "Test",
    "timestamp": 1234567890000
  }'
```

## 🔒 Sécurité

### Authentification

L'application supporte deux modes :

1. **Mode ouvert** (par défaut si `VITE_APP_SECRET_KEY` n'est pas défini)
   - Accès libre à l'application
   - Recommandé pour usage familial en intranet

2. **Mode protégé** (si `VITE_APP_SECRET_KEY` est défini)
   - Nécessite une clé d'accès
   - Partager l'URL avec la clé : `https://app.com/?key=VOTRE_CLE`
   - La clé est stockée en session (expire à la fermeture du navigateur)

### Bonnes pratiques

- ✅ **HTTPS obligatoire** en production (requis pour PWA)
- ✅ Utiliser des clés secrètes fortes et uniques
- ✅ Ne jamais committer le fichier `.env`
- ✅ Valider les uploads côté serveur (n8n)
- ✅ Limiter la taille des fichiers (par défaut 50MB)
- ✅ Sanitizer les inputs dans n8n
- ✅ Configurer CORS correctement sur n8n
- ✅ Monitorer les logs n8n pour détecter les abus

### CORS sur n8n

Si vous avez des erreurs CORS, configurer n8n :

```bash
# docker-compose.yml ou .env
N8N_ALLOWED_ORIGINS=https://votre-app.com
```

## 📱 Installation PWA

### Sur Android (Chrome, Edge)

1. Ouvrir l'app dans le navigateur
2. Menu ⋮ → "Installer l'application"
3. Confirmer

### Sur iOS (Safari)

1. Ouvrir l'app dans Safari
2. Bouton Partager (carré avec flèche)
3. "Sur l'écran d'accueil"
4. Confirmer

### Sur Desktop (Chrome, Edge)

1. Icône ⊕ dans la barre d'adresse
2. "Installer Soussou Souvenirs"

## 🎨 Personnalisation

### Couleurs

Modifier `tailwind.config.js` :
```javascript
colors: {
  'soussou-purple': '#a855f7',  // Violet principal
  'soussou-pink': '#ec4899',    // Rose principal
  'soussou-blue': '#3b82f6',    // Bleu principal
}
```

### Icônes

Remplacer les fichiers dans `public/icons/` :
- `icon-192x192.png` (192×192px)
- `icon-512x512.png` (512×512px)
- `apple-touch-icon.png` (180×180px)

### Nom de l'app

Modifier `vite.config.js` :
```javascript
manifest: {
  name: 'Votre Nom',
  short_name: 'Nom Court',
  // ...
}
```

## 🐛 Debugging

### Logs dans la console

L'application log toutes les opérations importantes :
- `F12` → Console

### Inspecter IndexedDB

- `F12` → Application → Storage → IndexedDB → `soussou-souvenirs-db`

### Tester le mode offline

- `F12` → Network → Cocher "Offline"

### Vérifier le Service Worker

- `F12` → Application → Service Workers

### Inspecter le manifest

- `F12` → Application → Manifest

## 📊 Structure du projet

```
soussou-souvenirs-pwa/
├── public/
│   ├── icons/               # Icônes PWA
│   ├── offline.html         # Page hors ligne
│   └── icon.svg             # Icône source
├── src/
│   ├── components/
│   │   └── App.jsx          # Composant principal
│   ├── services/
│   │   ├── storage.js       # IndexedDB
│   │   ├── sync.js          # Synchronisation n8n
│   │   └── compression.js   # Compression médias
│   ├── utils/
│   │   ├── auth.js          # Authentification
│   │   └── helpers.js       # Utilitaires
│   ├── main.jsx             # Point d'entrée
│   └── index.css            # Styles globaux
├── index.html               # HTML principal
├── vite.config.js           # Config Vite + PWA
├── tailwind.config.js       # Config Tailwind
├── package.json             # Dépendances
├── .env.example             # Variables d'env (template)
└── README.md                # Ce fichier
```

## 🧪 Tests manuels

Checklist de tests avant production :

- [ ] Capture photo (caméra + upload)
- [ ] Capture vidéo (caméra + upload)
- [ ] Enregistrement audio
- [ ] Saisie texte
- [ ] Remplissage formulaire complet
- [ ] Sauvegarde brouillon
- [ ] Validation et synchronisation
- [ ] Liste des souvenirs
- [ ] Consultation détaillée
- [ ] Suppression avec confirmation
- [ ] Mode offline (désactiver réseau)
- [ ] Synchronisation automatique au retour en ligne
- [ ] Installation PWA
- [ ] Notifications (si activées)
- [ ] Authentification (si activée)
- [ ] Responsive mobile, tablette, desktop
- [ ] Compression des images
- [ ] Gestion des erreurs réseau

## 📈 Performance

### Optimisations appliquées

- ✅ Code splitting (React vendor, Icons)
- ✅ Lazy loading des composants
- ✅ Compression WebP pour images
- ✅ Cache agressif (Service Worker)
- ✅ Minification JS/CSS
- ✅ Tree shaking
- ✅ Préchargement des assets critiques
- ✅ Debouncing des inputs

### Lighthouse Score cible

- Performance : > 90
- Accessibility : > 95
- Best Practices : > 90
- SEO : > 90
- PWA : 100

## 🔄 Mise à jour

Après modification du code :

1. `npm run build`
2. Déployer le nouveau `dist/`
3. Le Service Worker détectera la mise à jour
4. L'utilisateur sera invité à rafraîchir

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation n8n : https://docs.n8n.io/
- Consulter la documentation Vite PWA : https://vite-pwa-org.netlify.app/

## 📝 Licence

MIT

## 👥 Contributeurs

Développé avec ❤️ pour aider les personnes atteintes d'Alzheimer et leurs proches.

---

**Note importante** : Cette application traite des données personnelles sensibles (photos, vidéos de famille). Assurez-vous de respecter le RGPD et d'obtenir le consentement des personnes concernées.
