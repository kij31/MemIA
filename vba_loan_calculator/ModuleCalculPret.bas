Attribute VB_Name = "ModuleCalculPret"
Option Explicit

' ========================================
' MODULE DE CALCUL D'AMORTISSEMENT DE PRÊT
' ========================================

' Fonction pour calculer la mensualité
Public Function CalculerMensualite(montant As Double, tauxAnnuel As Double, dureeAnnees As Integer) As Double
    Dim tauxMensuel As Double
    Dim nbMensualites As Integer

    ' Convertir le taux annuel en taux mensuel
    tauxMensuel = tauxAnnuel / 12 / 100
    nbMensualites = dureeAnnees * 12

    ' Formule de calcul de la mensualité (formule d'amortissement constant)
    If tauxMensuel > 0 Then
        CalculerMensualite = montant * (tauxMensuel * (1 + tauxMensuel) ^ nbMensualites) / ((1 + tauxMensuel) ^ nbMensualites - 1)
    Else
        ' Si le taux est 0, division simple
        CalculerMensualite = montant / nbMensualites
    End If
End Function

' Fonction pour calculer les frais de notaire (estimation France)
Public Function CalculerFraisNotaire(montant As Double, typeAchat As String) As Double
    Dim pourcentage As Double

    ' Estimation des frais de notaire en France
    Select Case UCase(typeAchat)
        Case "ANCIEN"
            ' Pour l'ancien : environ 7-8% du prix
            pourcentage = 0.08
        Case "NEUF"
            ' Pour le neuf : environ 2-3% du prix
            pourcentage = 0.03
        Case Else
            ' Par défaut, on prend l'ancien
            pourcentage = 0.08
    End Select

    CalculerFraisNotaire = montant * pourcentage
End Function

' Procédure principale pour générer le tableau d'amortissement
Public Sub GenererTableauAmortissement()
    Dim ws As Worksheet
    Dim wsData As Worksheet
    Dim montant As Double
    Dim tauxAnnuel As Double
    Dim dureeAnnees As Integer
    Dim typeAchat As String
    Dim mensualite As Double
    Dim fraisNotaire As Double
    Dim nbMensualites As Integer
    Dim tauxMensuel As Double
    Dim i As Integer
    Dim capitalRestant As Double
    Dim interetsMois As Double
    Dim capitalRembourse As Double
    Dim ligne As Integer

    ' Référence à la feuille de paramètres
    On Error Resume Next
    Set wsData = ThisWorkbook.Worksheets("Parametres")
    On Error GoTo 0

    If wsData Is Nothing Then
        MsgBox "La feuille 'Parametres' n'existe pas. Veuillez la créer.", vbCritical
        Exit Sub
    End If

    ' Récupérer les paramètres
    montant = wsData.Range("B2").Value
    tauxAnnuel = wsData.Range("B3").Value
    dureeAnnees = wsData.Range("B4").Value
    typeAchat = wsData.Range("B5").Value

    ' Vérifier les valeurs
    If montant <= 0 Or tauxAnnuel < 0 Or dureeAnnees <= 0 Then
        MsgBox "Veuillez vérifier les paramètres saisis.", vbExclamation
        Exit Sub
    End If

    ' Calculer la mensualité et les frais de notaire
    mensualite = CalculerMensualite(montant, tauxAnnuel, dureeAnnees)
    fraisNotaire = CalculerFraisNotaire(montant, typeAchat)

    ' Afficher les résultats
    wsData.Range("B7").Value = mensualite
    wsData.Range("B8").Value = fraisNotaire
    wsData.Range("B9").Value = mensualite * dureeAnnees * 12
    wsData.Range("B10").Value = (mensualite * dureeAnnees * 12) - montant

    ' Créer ou nettoyer la feuille de tableau d'amortissement
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Amortissement")
    If ws Is Nothing Then
        Set ws = ThisWorkbook.Worksheets.Add
        ws.Name = "Amortissement"
    Else
        ws.Cells.Clear
    End If
    On Error GoTo 0

    ' En-têtes du tableau
    ws.Range("A1").Value = "Mois"
    ws.Range("B1").Value = "Année"
    ws.Range("C1").Value = "Mensualité"
    ws.Range("D1").Value = "Intérêts"
    ws.Range("E1").Value = "Capital remboursé"
    ws.Range("F1").Value = "Capital restant"
    ws.Range("G1").Value = "Total intérêts cumulés"
    ws.Range("H1").Value = "Total capital remboursé"

    ' Formater les en-têtes
    With ws.Range("A1:H1")
        .Font.Bold = True
        .Interior.Color = RGB(0, 112, 192)
        .Font.Color = RGB(255, 255, 255)
    End With

    ' Initialisation
    nbMensualites = dureeAnnees * 12
    tauxMensuel = tauxAnnuel / 12 / 100
    capitalRestant = montant
    ligne = 2

    Dim totalInteretsCumules As Double
    Dim totalCapitalRembourse As Double
    totalInteretsCumules = 0
    totalCapitalRembourse = 0

    ' Générer le tableau d'amortissement
    For i = 1 To nbMensualites
        ' Calcul des intérêts du mois
        interetsMois = capitalRestant * tauxMensuel

        ' Calcul du capital remboursé ce mois
        capitalRembourse = mensualite - interetsMois

        ' Mise à jour du capital restant
        capitalRestant = capitalRestant - capitalRembourse

        ' Cumuler
        totalInteretsCumules = totalInteretsCumules + interetsMois
        totalCapitalRembourse = totalCapitalRembourse + capitalRembourse

        ' Remplir la ligne
        ws.Cells(ligne, 1).Value = i
        ws.Cells(ligne, 2).Value = Round(i / 12, 2)
        ws.Cells(ligne, 3).Value = mensualite
        ws.Cells(ligne, 4).Value = interetsMois
        ws.Cells(ligne, 5).Value = capitalRembourse
        ws.Cells(ligne, 6).Value = capitalRestant
        ws.Cells(ligne, 7).Value = totalInteretsCumules
        ws.Cells(ligne, 8).Value = totalCapitalRembourse

        ' Formater les cellules en euros
        ws.Range(ws.Cells(ligne, 3), ws.Cells(ligne, 8)).NumberFormat = "#,##0.00 €"

        ligne = ligne + 1
    Next i

    ' Auto-ajuster les colonnes
    ws.Columns("A:H").AutoFit

    MsgBox "Tableau d'amortissement généré avec succès !" & vbCrLf & _
           "Mensualité : " & Format(mensualite, "#,##0.00 €") & vbCrLf & _
           "Frais de notaire : " & Format(fraisNotaire, "#,##0.00 €") & vbCrLf & _
           "Coût total du crédit : " & Format((mensualite * dureeAnnees * 12) - montant, "#,##0.00 €"), _
           vbInformation, "Calcul terminé"

    ' Créer le graphique
    Call CreerGraphique
End Sub

' Procédure pour créer la feuille de paramètres
Public Sub CreerFeuilleParametres()
    Dim ws As Worksheet

    ' Vérifier si la feuille existe déjà
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Parametres")
    On Error GoTo 0

    If Not ws Is Nothing Then
        MsgBox "La feuille 'Parametres' existe déjà.", vbInformation
        Exit Sub
    End If

    ' Créer la feuille
    Set ws = ThisWorkbook.Worksheets.Add
    ws.Name = "Parametres"

    ' Créer l'interface de saisie
    ws.Range("A1").Value = "CALCULATEUR D'AMORTISSEMENT DE PRÊT"
    ws.Range("A1").Font.Bold = True
    ws.Range("A1").Font.Size = 14

    ws.Range("A2").Value = "Montant à emprunter (€) :"
    ws.Range("A3").Value = "Taux d'intérêt annuel (%) :"
    ws.Range("A4").Value = "Durée (années) :"
    ws.Range("A5").Value = "Type d'achat (NEUF/ANCIEN) :"

    ws.Range("A7").Value = "Mensualité (€) :"
    ws.Range("A8").Value = "Frais de notaire (€) :"
    ws.Range("A9").Value = "Coût total (€) :"
    ws.Range("A10").Value = "Coût des intérêts (€) :"

    ' Valeurs par défaut
    ws.Range("B2").Value = 200000
    ws.Range("B3").Value = 1.5
    ws.Range("B4").Value = 20
    ws.Range("B5").Value = "ANCIEN"

    ' Formater
    ws.Range("A2:A5").Font.Bold = True
    ws.Range("A7:A10").Font.Bold = True
    ws.Range("A7:A10").Interior.Color = RGB(255, 242, 204)
    ws.Range("B7:B10").Interior.Color = RGB(255, 242, 204)
    ws.Range("B7:B10").NumberFormat = "#,##0.00 €"

    ' Ajouter un bouton
    Dim btn As Button
    Set btn = ws.Buttons.Add(350, 10, 150, 30)
    btn.OnAction = "GenererTableauAmortissement"
    btn.Text = "Calculer"

    ws.Columns("A:B").AutoFit

    MsgBox "Feuille de paramètres créée avec succès !" & vbCrLf & _
           "Remplissez les paramètres et cliquez sur 'Calculer'.", vbInformation
End Sub
