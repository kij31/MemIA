Attribute VB_Name = "ModuleGraphique"
Option Explicit

' ========================================
' MODULE DE GÉNÉRATION DE GRAPHIQUE
' ========================================

Public Sub CreerGraphique()
    Dim ws As Worksheet
    Dim wsGraph As Worksheet
    Dim chartObj As ChartObject
    Dim dataRange As Range
    Dim lastRow As Long
    Dim nbAnnees As Integer
    Dim i As Integer
    Dim anneeActuelle As Integer
    Dim ligneDebut As Integer

    ' Référence à la feuille d'amortissement
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Amortissement")
    On Error GoTo 0

    If ws Is Nothing Then
        MsgBox "Veuillez d'abord générer le tableau d'amortissement.", vbExclamation
        Exit Sub
    End If

    ' Trouver la dernière ligne avec des données
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row

    If lastRow < 2 Then
        MsgBox "Aucune donnée à afficher dans le graphique.", vbExclamation
        Exit Sub
    End If

    ' Créer ou nettoyer la feuille de graphique
    On Error Resume Next
    Set wsGraph = ThisWorkbook.Worksheets("Graphique")
    If wsGraph Is Nothing Then
        Set wsGraph = ThisWorkbook.Worksheets.Add
        wsGraph.Name = "Graphique"
    Else
        ' Supprimer tous les graphiques existants
        Dim obj As Object
        For Each obj In wsGraph.ChartObjects
            obj.Delete
        Next obj
    End If
    On Error GoTo 0

    ' Créer un tableau pour les données annuelles
    ' On va créer un résumé par année
    wsGraph.Cells.Clear
    wsGraph.Range("A1").Value = "Année"
    wsGraph.Range("B1").Value = "Capital remboursé cumulé (€)"
    wsGraph.Range("C1").Value = "Intérêts cumulés (€)"

    ' Formater les en-têtes
    With wsGraph.Range("A1:C1")
        .Font.Bold = True
        .Interior.Color = RGB(0, 112, 192)
        .Font.Color = RGB(255, 255, 255)
    End With

    ' Remplir les données annuelles (on prend la dernière ligne de chaque année)
    nbAnnees = WorksheetFunction.RoundUp((lastRow - 1) / 12, 0)
    ligneDebut = 2

    For i = 1 To nbAnnees
        Dim ligneMois As Integer
        ligneMois = i * 12 + 1 ' +1 car la ligne 1 contient les en-têtes dans ws

        If ligneMois <= lastRow Then
            wsGraph.Cells(ligneDebut, 1).Value = i
            wsGraph.Cells(ligneDebut, 2).Value = ws.Cells(ligneMois, 8).Value ' Capital remboursé cumulé
            wsGraph.Cells(ligneDebut, 3).Value = ws.Cells(ligneMois, 7).Value ' Intérêts cumulés

            ' Formater en euros
            wsGraph.Cells(ligneDebut, 2).NumberFormat = "#,##0.00 €"
            wsGraph.Cells(ligneDebut, 3).NumberFormat = "#,##0.00 €"

            ligneDebut = ligneDebut + 1
        End If
    Next i

    ' Auto-ajuster les colonnes
    wsGraph.Columns("A:C").AutoFit

    ' Créer le graphique
    Set dataRange = wsGraph.Range(wsGraph.Cells(1, 1), wsGraph.Cells(ligneDebut - 1, 3))

    Set chartObj = wsGraph.ChartObjects.Add(Left:=50, Width:=600, Top:=50, Height:=400)

    With chartObj.Chart
        .SetSourceData Source:=dataRange
        .ChartType = xlLineMarkers

        ' Titre du graphique
        .HasTitle = True
        .ChartTitle.Text = "Évolution du remboursement du prêt"
        .ChartTitle.Font.Size = 14
        .ChartTitle.Font.Bold = True

        ' Axe des X (années)
        With .Axes(xlCategory)
            .HasTitle = True
            .AxisTitle.Text = "Années"
            .AxisTitle.Font.Bold = True
        End With

        ' Axe des Y (montants)
        With .Axes(xlValue)
            .HasTitle = True
            .AxisTitle.Text = "Montant (€)"
            .AxisTitle.Font.Bold = True
            .TickLabels.NumberFormat = "#,##0 €"
        End With

        ' Légende
        .HasLegend = True
        .Legend.Position = xlLegendPositionBottom

        ' Personnaliser les séries
        If .SeriesCollection.Count >= 2 Then
            ' Série 1 : Capital remboursé (bleu)
            With .SeriesCollection(1)
                .Name = "Capital remboursé"
                .Format.Line.ForeColor.RGB = RGB(0, 112, 192)
                .Format.Line.Weight = 2.5
                .MarkerStyle = xlMarkerStyleCircle
                .MarkerSize = 7
            End With

            ' Série 2 : Intérêts (rouge)
            With .SeriesCollection(2)
                .Name = "Intérêts payés"
                .Format.Line.ForeColor.RGB = RGB(255, 0, 0)
                .Format.Line.Weight = 2.5
                .MarkerStyle = xlMarkerStyleSquare
                .MarkerSize = 7
            End With
        End If

        ' Style du graphique
        .ChartStyle = 227
    End With

    MsgBox "Graphique créé avec succès dans la feuille 'Graphique' !", vbInformation
End Sub

' Procédure alternative pour créer un graphique combiné (barres empilées + ligne)
Public Sub CreerGraphiqueAvance()
    Dim ws As Worksheet
    Dim wsGraph As Worksheet
    Dim chartObj As ChartObject
    Dim dataRange As Range
    Dim lastRow As Long
    Dim nbAnnees As Integer
    Dim i As Integer
    Dim ligneDebut As Integer

    ' Référence à la feuille d'amortissement
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Amortissement")
    On Error GoTo 0

    If ws Is Nothing Then
        MsgBox "Veuillez d'abord générer le tableau d'amortissement.", vbExclamation
        Exit Sub
    End If

    ' Trouver la dernière ligne avec des données
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row

    If lastRow < 2 Then
        MsgBox "Aucune donnée à afficher dans le graphique.", vbExclamation
        Exit Sub
    End If

    ' Créer ou obtenir la feuille de graphique
    On Error Resume Next
    Set wsGraph = ThisWorkbook.Worksheets("Graphique")
    If wsGraph Is Nothing Then
        Set wsGraph = ThisWorkbook.Worksheets.Add
        wsGraph.Name = "Graphique"
    End If
    On Error GoTo 0

    ' Créer un tableau pour les données annuelles
    wsGraph.Cells.Clear
    wsGraph.Range("A1").Value = "Année"
    wsGraph.Range("B1").Value = "Capital remboursé (€)"
    wsGraph.Range("C1").Value = "Intérêts payés (€)"

    ' Formater les en-têtes
    With wsGraph.Range("A1:C1")
        .Font.Bold = True
        .Interior.Color = RGB(0, 112, 192)
        .Font.Color = RGB(255, 255, 255)
    End With

    ' Remplir les données annuelles
    nbAnnees = WorksheetFunction.RoundUp((lastRow - 1) / 12, 0)
    ligneDebut = 2

    For i = 1 To nbAnnees
        Dim ligneMois As Integer
        ligneMois = i * 12 + 1

        If ligneMois <= lastRow Then
            wsGraph.Cells(ligneDebut, 1).Value = i
            wsGraph.Cells(ligneDebut, 2).Value = ws.Cells(ligneMois, 8).Value
            wsGraph.Cells(ligneDebut, 3).Value = ws.Cells(ligneMois, 7).Value

            ' Formater
            wsGraph.Cells(ligneDebut, 2).NumberFormat = "#,##0.00 €"
            wsGraph.Cells(ligneDebut, 3).NumberFormat = "#,##0.00 €"

            ligneDebut = ligneDebut + 1
        End If
    Next i

    wsGraph.Columns("A:C").AutoFit

    ' Créer le graphique en barres empilées
    Set dataRange = wsGraph.Range(wsGraph.Cells(1, 1), wsGraph.Cells(ligneDebut - 1, 3))

    Set chartObj = wsGraph.ChartObjects.Add(Left:=50, Width:=700, Top:=50, Height:=450)

    With chartObj.Chart
        .SetSourceData Source:=dataRange
        .ChartType = xlColumnStacked

        .HasTitle = True
        .ChartTitle.Text = "Répartition Capital / Intérêts par année"
        .ChartTitle.Font.Size = 14
        .ChartTitle.Font.Bold = True

        With .Axes(xlCategory)
            .HasTitle = True
            .AxisTitle.Text = "Années"
            .AxisTitle.Font.Bold = True
        End With

        With .Axes(xlValue)
            .HasTitle = True
            .AxisTitle.Text = "Montant cumulé (€)"
            .AxisTitle.Font.Bold = True
            .TickLabels.NumberFormat = "#,##0 €"
        End With

        .HasLegend = True
        .Legend.Position = xlLegendPositionBottom

        ' Couleurs
        If .SeriesCollection.Count >= 2 Then
            .SeriesCollection(1).Format.Fill.ForeColor.RGB = RGB(0, 176, 80)
            .SeriesCollection(2).Format.Fill.ForeColor.RGB = RGB(255, 0, 0)
        End If
    End With

    MsgBox "Graphique avancé créé avec succès !", vbInformation
End Sub
