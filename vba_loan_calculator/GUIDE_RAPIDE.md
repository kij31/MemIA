# Guide Rapide - Calculateur de Prêt VBA

## Installation en 5 minutes

### 1. Créer le fichier Excel
```
1. Ouvrir Excel
2. Nouveau classeur
3. Enregistrer sous : CalculateurPret.xlsm (format avec macros)
```

### 2. Importer les modules VBA
```
1. Appuyer sur Alt + F11
2. Clic droit sur VBAProject
3. Fichier > Importer un fichier
4. Importer dans l'ordre :
   - ModuleCalculPret.bas
   - ModuleGraphique.bas
   - ModuleExportCSV.bas
```

### 3. Activer les macros
```
1. Fichier > Options > Centre de gestion
2. Paramètres du Centre de gestion
3. Paramètres des macros
4. Cocher "Activer toutes les macros"
```

### 4. Créer l'interface
```
1. Appuyer sur Alt + F8
2. Sélectionner : CreerFeuilleParametres
3. Cliquer sur Exécuter
```

## Utilisation rapide

### Étape 1 : Saisir les données
Dans la feuille **Parametres** :
- **B2** : Montant (ex: 200000)
- **B3** : Taux annuel (ex: 1.5)
- **B4** : Durée en années (ex: 20)
- **B5** : Type (ANCIEN ou NEUF)

### Étape 2 : Calculer
Cliquer sur le bouton **"Calculer"**

### Étape 3 : Consulter les résultats
- **Feuille Parametres** : Mensualité, frais de notaire, coût total
- **Feuille Amortissement** : Tableau détaillé mois par mois
- **Feuille Graphique** : Visualisation graphique

### Étape 4 : Exporter (optionnel)
```
Alt + F8 > ExporterTout > Exécuter
```

## Raccourcis essentiels

| Touche | Action |
|--------|--------|
| **Alt + F8** | Liste des macros |
| **Alt + F11** | Éditeur VBA |
| **Ctrl + S** | Enregistrer |

## Exemple complet

**Paramètres** :
- Montant : 250 000 €
- Taux : 1,8 %
- Durée : 25 ans
- Type : ANCIEN

**Cliquer sur "Calculer"**

**Résultats automatiques** :
- Mensualité : ~1 031 €
- Frais notaire : 20 000 €
- Coût total : 309 300 €
- Intérêts : 59 300 €

**3 feuilles créées** :
1. Parametres (saisie + résultats)
2. Amortissement (300 lignes détaillées)
3. Graphique (visualisation)

## Macros principales

### Pour démarrer
```
CreerFeuilleParametres → Crée l'interface
```

### Pour calculer
```
GenererTableauAmortissement → Calcule tout
```

### Pour exporter
```
ExporterAmortissementCSV → Exporte le tableau
ExporterParametresCSV → Exporte les paramètres
ExporterTout → Exporte tout
```

### Pour le graphique
```
CreerGraphique → Graphique en lignes
CreerGraphiqueAvance → Graphique en barres
```

## Dépannage express

### Problème : "Macros désactivées"
**Solution** : Fichier > Options > Centre de gestion > Activer toutes les macros

### Problème : "Feuille Parametres n'existe pas"
**Solution** : Alt + F8 > CreerFeuilleParametres > Exécuter

### Problème : "Aucun graphique"
**Solution** : D'abord calculer, ensuite Alt + F8 > CreerGraphique

### Problème : "Erreur lors de l'export"
**Solution** : Vérifier les droits d'écriture, choisir un autre dossier

## Points importants

✅ **Toujours enregistrer en .xlsm** (avec macros)
✅ **Activer les macros** avant utilisation
✅ **Créer la feuille Parametres** en premier
✅ **Calculer avant d'exporter** ou de créer le graphique

⚠️ **Attention** :
- Taux en % (ex: 1.5 pour 1,5%)
- Durée en années (ex: 20 pour 20 ans)
- Type : NEUF ou ANCIEN (en majuscules)

## Export CSV

**Format européen** :
- Séparateur : `;` (point-virgule)
- Décimales : `,` (virgule)

**Utilisation** :
- Compatible Excel direct
- Compatible LibreOffice
- Compatible Google Sheets

## Captures d'écran des résultats

### Feuille Parametres
```
┌──────────────────────────────────────┬──────────┐
│ Montant à emprunter (€) :            │ 200000   │
│ Taux d'intérêt annuel (%) :          │ 1,5      │
│ Durée (années) :                     │ 20       │
│ Type d'achat (NEUF/ANCIEN) :         │ ANCIEN   │
├──────────────────────────────────────┼──────────┤
│ Mensualité (€) :                     │ 965,61   │
│ Frais de notaire (€) :               │ 16000,00 │
│ Coût total (€) :                     │ 231746,40│
│ Coût des intérêts (€) :              │ 31746,40 │
└──────────────────────────────────────┴──────────┘
```

### Feuille Amortissement (extrait)
```
┌──────┬────────┬────────────┬──────────┬──────────────────┬─────────────────┐
│ Mois │ Année  │ Mensualité │ Intérêts │ Capital remb.    │ Capital restant │
├──────┼────────┼────────────┼──────────┼──────────────────┼─────────────────┤
│ 1    │ 0,08   │ 965,61 €   │ 250,00 € │ 715,61 €         │ 199284,39 €     │
│ 2    │ 0,17   │ 965,61 €   │ 249,11 € │ 716,50 €         │ 198567,89 €     │
│ ...  │ ...    │ ...        │ ...      │ ...              │ ...             │
│ 240  │ 20,00  │ 965,61 €   │ 1,20 €   │ 964,41 €         │ 0,00 €          │
└──────┴────────┴────────────┴──────────┴──────────────────┴─────────────────┘
```

## Support

**Documentation complète** : Voir `README.md`

**Fichiers fournis** :
- `ModuleCalculPret.bas` - Code principal
- `ModuleGraphique.bas` - Code graphiques
- `ModuleExportCSV.bas` - Code export/import
- `README.md` - Documentation complète
- `GUIDE_RAPIDE.md` - Ce guide
- `template_parametres.csv` - Template d'import
- `exemple_export_amortissement.csv` - Exemple de sortie

Bonne utilisation ! 🎉
