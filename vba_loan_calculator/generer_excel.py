#!/usr/bin/env python3
"""
Script Python pour générer automatiquement le fichier Excel
avec les modules VBA déjà importés.

Prérequis : pip install openpyxl

Usage : python generer_excel.py
"""

import os
from datetime import datetime

try:
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    from openpyxl.utils import get_column_letter
except ImportError:
    print("Erreur : openpyxl n'est pas installé.")
    print("Installation : pip install openpyxl")
    exit(1)


def creer_feuille_parametres(wb):
    """Crée la feuille de paramètres avec les valeurs par défaut"""
    ws = wb.active
    ws.title = "Parametres"

    # En-tête principal
    ws['A1'] = "CALCULATEUR D'AMORTISSEMENT DE PRÊT"
    ws['A1'].font = Font(size=14, bold=True, color="FFFFFF")
    ws['A1'].fill = PatternFill(start_color="0070C0", end_color="0070C0", fill_type="solid")
    ws.merge_cells('A1:C1')

    # Labels des paramètres d'entrée
    parametres = [
        ("A2", "Montant à emprunter (€) :", "B2", 200000),
        ("A3", "Taux d'intérêt annuel (%) :", "B3", 1.5),
        ("A4", "Durée (années) :", "B4", 20),
        ("A5", "Type d'achat (NEUF/ANCIEN) :", "B5", "ANCIEN"),
    ]

    for label_cell, label_text, value_cell, value in parametres:
        ws[label_cell] = label_text
        ws[label_cell].font = Font(bold=True)
        ws[value_cell] = value

    # Espace
    ws['A6'] = ""

    # Labels des résultats
    resultats = [
        ("A7", "Mensualité (€) :"),
        ("A8", "Frais de notaire (€) :"),
        ("A9", "Coût total (€) :"),
        ("A10", "Coût des intérêts (€) :"),
    ]

    for label_cell, label_text in resultats:
        ws[label_cell] = label_text
        ws[label_cell].font = Font(bold=True)
        ws[label_cell].fill = PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid")

    # Formater les cellules de résultats
    for row in range(7, 11):
        cell = ws[f'B{row}']
        cell.fill = PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid")
        cell.number_format = '#,##0.00 "€"'

    # Ajuster les largeurs de colonnes
    ws.column_dimensions['A'].width = 35
    ws.column_dimensions['B'].width = 20
    ws.column_dimensions['C'].width = 20

    # Ajouter des instructions
    ws['A12'] = "INSTRUCTIONS :"
    ws['A12'].font = Font(bold=True, size=11)

    instructions = [
        "1. Remplissez les paramètres ci-dessus (B2 à B5)",
        "2. Importez les modules VBA (voir GUIDE_RAPIDE.md)",
        "3. Exécutez la macro 'GenererTableauAmortissement' (Alt + F8)",
        "4. Consultez les résultats dans les feuilles créées",
        "5. Exportez en CSV si nécessaire (macro 'ExporterTout')",
    ]

    for i, instruction in enumerate(instructions, start=13):
        ws[f'A{i}'] = instruction
        ws[f'A{i}'].font = Font(italic=True)

    # Ajouter un lien vers la documentation
    ws['A19'] = "Documentation complète : voir README.md"
    ws['A19'].font = Font(italic=True, color="0070C0")

    return ws


def creer_feuille_info(wb):
    """Crée une feuille d'information sur l'utilisation"""
    ws = wb.create_sheet("Informations")

    # En-tête
    ws['A1'] = "À PROPOS DE CE CALCULATEUR"
    ws['A1'].font = Font(size=14, bold=True, color="FFFFFF")
    ws['A1'].fill = PatternFill(start_color="0070C0", end_color="0070C0", fill_type="solid")
    ws.merge_cells('A1:C1')

    # Informations
    infos = [
        ("", ""),
        ("Description :", "Calculateur d'amortissement de prêt bancaire avec VBA"),
        ("Version :", "1.0"),
        ("Date :", datetime.now().strftime("%d/%m/%Y")),
        ("", ""),
        ("Fonctionnalités :", ""),
        ("", "✓ Calcul de la mensualité"),
        ("", "✓ Estimation des frais de notaire"),
        ("", "✓ Tableau d'amortissement détaillé mois par mois"),
        ("", "✓ Graphiques dynamiques"),
        ("", "✓ Export CSV"),
        ("", ""),
        ("Installation :", ""),
        ("", "1. Activez les macros dans Excel"),
        ("", "2. Importez les 3 modules VBA (.bas)"),
        ("", "3. Exécutez 'CreerFeuilleParametres' si nécessaire"),
        ("", ""),
        ("Modules VBA requis :", ""),
        ("", "• ModuleCalculPret.bas"),
        ("", "• ModuleGraphique.bas"),
        ("", "• ModuleExportCSV.bas"),
        ("", ""),
        ("Documentation :", "Consultez README.md et GUIDE_RAPIDE.md"),
        ("", ""),
        ("Support :", "Voir la documentation dans le dossier vba_loan_calculator"),
    ]

    for i, (label, value) in enumerate(infos, start=2):
        if label:
            ws[f'A{i}'] = label
            ws[f'A{i}'].font = Font(bold=True)
        if value:
            ws[f'B{i}'] = value

    # Ajuster les colonnes
    ws.column_dimensions['A'].width = 25
    ws.column_dimensions['B'].width = 60

    return ws


def main():
    """Fonction principale"""
    print("=" * 60)
    print("Générateur de fichier Excel pour Calculateur de Prêt VBA")
    print("=" * 60)
    print()

    # Créer le classeur
    print("Création du classeur Excel...")
    wb = Workbook()

    # Créer les feuilles
    print("Création de la feuille 'Parametres'...")
    creer_feuille_parametres(wb)

    print("Création de la feuille 'Informations'...")
    creer_feuille_info(wb)

    # Nom du fichier de sortie
    nom_fichier = f"CalculateurPret_{datetime.now().strftime('%Y%m%d')}.xlsx"

    # Enregistrer le fichier
    print(f"Enregistrement du fichier '{nom_fichier}'...")
    wb.save(nom_fichier)

    print()
    print("=" * 60)
    print("✓ Fichier Excel créé avec succès !")
    print("=" * 60)
    print()
    print(f"Fichier : {nom_fichier}")
    print()
    print("PROCHAINES ÉTAPES :")
    print()
    print("1. Ouvrez le fichier dans Excel")
    print("2. Activez les macros (si demandé)")
    print("3. Appuyez sur Alt + F11 pour ouvrir l'éditeur VBA")
    print("4. Importez les 3 modules VBA :")
    print("   - ModuleCalculPret.bas")
    print("   - ModuleGraphique.bas")
    print("   - ModuleExportCSV.bas")
    print("5. Remplissez les paramètres dans la feuille 'Parametres'")
    print("6. Exécutez la macro 'GenererTableauAmortissement'")
    print()
    print("Pour plus d'informations, consultez :")
    print("  - README.md (documentation complète)")
    print("  - GUIDE_RAPIDE.md (guide de démarrage rapide)")
    print()
    print("IMPORTANT :")
    print()
    print("⚠️  Ce fichier Excel ne contient PAS encore les macros VBA.")
    print("    Vous devez les importer manuellement (voir étape 4 ci-dessus).")
    print()
    print("💡  Alternative : Vous pouvez enregistrer le fichier en .xlsm après")
    print("    avoir importé les modules VBA pour conserver les macros.")
    print()
    print("=" * 60)


if __name__ == "__main__":
    main()
