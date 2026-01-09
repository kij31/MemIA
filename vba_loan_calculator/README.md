# Calculateur d'Amortissement de Prêt Bancaire - VBA

## Description

Cette application VBA pour Microsoft Excel permet de calculer l'amortissement d'un prêt bancaire de manière complète et professionnelle.

### Fonctionnalités

✅ **Calcul automatique** de :
- Mensualité (remboursement constant)
- Frais de notaire (estimation France)
- Coût total du crédit
- Coût total des intérêts

✅ **Tableau d'amortissement détaillé** avec :
- Détail mois par mois
- Part d'intérêts et part de capital
- Capital restant dû
- Cumuls des intérêts et du capital remboursé

✅ **Graphiques dynamiques** :
- Évolution du capital remboursé vs intérêts payés
- Axe X : temps en années
- Axe Y : montants en euros

✅ **Export CSV** :
- Export du tableau d'amortissement complet
- Export des paramètres et résultats
- Format CSV compatible Excel (séparateur point-virgule)

## Installation

### Prérequis
- Microsoft Excel 2010 ou supérieur
- Activation des macros dans Excel

### Étapes d'installation

1. **Créer un nouveau classeur Excel**
   - Ouvrir Excel
   - Créer un nouveau classeur vide
   - Enregistrer sous format `.xlsm` (Excel avec macros)
   - Exemple : `CalculateurPret.xlsm`

2. **Ouvrir l'éditeur VBA**
   - Appuyer sur `Alt + F11` pour ouvrir l'éditeur VBA
   - Ou via le menu : Développeur > Visual Basic

3. **Importer les modules VBA**
   - Dans l'éditeur VBA, clic droit sur le projet (VBAProject)
   - Sélectionner : Fichier > Importer un fichier...
   - Importer les 3 fichiers suivants dans l'ordre :
     1. `ModuleCalculPret.bas`
     2. `ModuleGraphique.bas`
     3. `ModuleExportCSV.bas`

4. **Activer les macros**
   - Fichier > Options > Centre de gestion de la confidentialité
   - Paramètres du Centre de gestion de la confidentialité
   - Paramètres des macros
   - Sélectionner "Activer toutes les macros"
   - ⚠️ À utiliser uniquement pour vos propres fichiers !

5. **Créer l'interface utilisateur**
   - Dans Excel, appuyer sur `Alt + F8`
   - Sélectionner la macro `CreerFeuilleParametres`
   - Cliquer sur "Exécuter"
   - Une feuille "Parametres" sera créée automatiquement

## Utilisation

### 1. Saisir les paramètres du prêt

Dans la feuille **"Parametres"**, remplir :

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| **Montant à emprunter (€)** | Capital emprunté | 200 000 € |
| **Taux d'intérêt annuel (%)** | Taux annuel nominal | 1,5 % |
| **Durée (années)** | Durée du prêt | 20 ans |
| **Type d'achat** | NEUF ou ANCIEN | ANCIEN |

### 2. Lancer le calcul

- Cliquer sur le bouton **"Calculer"**
- Ou exécuter la macro `GenererTableauAmortissement` (Alt + F8)

### 3. Consulter les résultats

**Dans la feuille "Parametres"** :
- Mensualité calculée
- Frais de notaire estimés
- Coût total du crédit
- Coût total des intérêts

**Dans la feuille "Amortissement"** :
- Tableau détaillé mois par mois
- 8 colonnes d'informations
- Formatage automatique en euros

**Dans la feuille "Graphique"** :
- Graphique avec évolution sur la durée
- Courbe du capital remboursé
- Courbe des intérêts cumulés

### 4. Exporter en CSV

Pour exporter les données :

#### Export du tableau d'amortissement complet
- Exécuter la macro `ExporterAmortissementCSV` (Alt + F8)
- Choisir l'emplacement et le nom du fichier
- Le fichier CSV est au format européen (séparateur `;`)

#### Export des paramètres et résultats
- Exécuter la macro `ExporterParametresCSV`
- Fichier CSV récapitulatif créé

#### Export complet
- Exécuter la macro `ExporterTout`
- Exporte à la fois les paramètres et le tableau

## Détails techniques

### Formules utilisées

**Mensualité (formule d'amortissement constant)** :
```
M = C × (t × (1 + t)^n) / ((1 + t)^n - 1)

Où :
M = mensualité
C = capital emprunté
t = taux mensuel (taux annuel / 12 / 100)
n = nombre de mensualités (durée en années × 12)
```

**Frais de notaire (estimation France)** :
- Ancien : 8% du montant
- Neuf : 3% du montant

**Intérêts du mois** :
```
Intérêts = Capital restant × taux mensuel
```

**Capital remboursé du mois** :
```
Capital remboursé = Mensualité - Intérêts
```

### Structure des fichiers

```
vba_loan_calculator/
├── ModuleCalculPret.bas       # Module principal avec calculs
├── ModuleGraphique.bas         # Module de génération de graphiques
├── ModuleExportCSV.bas         # Module d'export/import CSV
├── README.md                   # Ce fichier
└── template_parametres.csv     # Template CSV pour import
```

### Macros disponibles

| Macro | Description |
|-------|-------------|
| `CreerFeuilleParametres` | Crée l'interface de saisie |
| `GenererTableauAmortissement` | Calcule et génère le tableau |
| `CreerGraphique` | Génère le graphique standard |
| `CreerGraphiqueAvance` | Génère un graphique en barres empilées |
| `ExporterAmortissementCSV` | Exporte le tableau en CSV |
| `ExporterParametresCSV` | Exporte les paramètres en CSV |
| `ExporterTout` | Exporte tout en CSV |
| `ImporterParametresCSV` | Importe des paramètres depuis CSV |

## Exemples

### Exemple 1 : Achat dans l'ancien
- **Montant** : 250 000 €
- **Taux** : 1,8 % annuel
- **Durée** : 25 ans
- **Type** : ANCIEN

**Résultats** :
- Mensualité : ~1 031 €
- Frais de notaire : 20 000 €
- Coût total : 309 300 €
- Coût des intérêts : 59 300 €

### Exemple 2 : Achat dans le neuf
- **Montant** : 180 000 €
- **Taux** : 1,4 % annuel
- **Durée** : 20 ans
- **Type** : NEUF

**Résultats** :
- Mensualité : ~854 €
- Frais de notaire : 5 400 €
- Coût total : 204 960 €
- Coût des intérêts : 24 960 €

## Format CSV

### Format d'export

Les fichiers CSV générés utilisent :
- **Séparateur** : Point-virgule (`;`)
- **Décimales** : Virgule (`,`)
- **Encodage** : Windows-1252 / ANSI

Compatible avec :
- Excel (ouverture directe)
- LibreOffice Calc
- Google Sheets
- Tout éditeur de texte

### Import dans Excel
1. Ouvrir Excel
2. Données > Importer des données > Depuis un fichier texte
3. Sélectionner le fichier CSV
4. Choisir "Délimité" > Point-virgule
5. Importer

## Raccourcis clavier utiles

| Raccourci | Action |
|-----------|--------|
| `Alt + F8` | Ouvrir la liste des macros |
| `Alt + F11` | Ouvrir l'éditeur VBA |
| `Ctrl + S` | Enregistrer le classeur |
| `F5` | Dans VBA : exécuter le code |

## Dépannage

### Les macros ne fonctionnent pas
- Vérifier que les macros sont activées
- Enregistrer le fichier en format `.xlsm`
- Vérifier que les modules sont bien importés

### Erreur "La feuille Parametres n'existe pas"
- Exécuter la macro `CreerFeuilleParametres`

### Les graphiques ne s'affichent pas
- Vérifier que le tableau d'amortissement existe
- Réexécuter `GenererTableauAmortissement`

### L'export CSV ne fonctionne pas
- Vérifier les droits d'écriture dans le dossier
- Choisir un emplacement accessible

## Limitations

- Calcul basé sur un taux fixe uniquement
- Frais de notaire : estimation (peut varier)
- Pas de prise en compte des assurances
- Pas de prise en compte des frais de dossier

## Évolutions futures

- [ ] Ajout de l'assurance emprunteur
- [ ] Calcul avec taux variable
- [ ] Simulation de remboursement anticipé
- [ ] Export en PDF
- [ ] Interface UserForm personnalisée
- [ ] Comparaison de plusieurs offres

## Support

Pour toute question ou problème :
- Consulter ce README
- Vérifier que les modules sont correctement importés
- Vérifier que les macros sont activées

## Licence

Ce projet est libre d'utilisation pour un usage personnel et professionnel.

## Auteur

Créé avec VBA pour Microsoft Excel.
Version 1.0 - Janvier 2026
