Attribute VB_Name = "ModuleExportCSV"
Option Explicit

' ========================================
' MODULE D'EXPORT CSV
' ========================================

' Exporter le tableau d'amortissement en CSV
Public Sub ExporterAmortissementCSV()
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim lastCol As Long
    Dim filePath As String
    Dim fileNum As Integer
    Dim i As Long
    Dim j As Integer
    Dim ligne As String
    Dim cellValue As String

    ' Référence à la feuille d'amortissement
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Amortissement")
    On Error GoTo 0

    If ws Is Nothing Then
        MsgBox "Veuillez d'abord générer le tableau d'amortissement.", vbExclamation
        Exit Sub
    End If

    ' Trouver la dernière ligne et colonne avec des données
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    lastCol = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column

    If lastRow < 2 Then
        MsgBox "Aucune donnée à exporter.", vbExclamation
        Exit Sub
    End If

    ' Demander à l'utilisateur où enregistrer le fichier
    filePath = Application.GetSaveAsFilename( _
        InitialFileName:="Amortissement_Pret_" & Format(Now, "yyyymmdd_hhmmss") & ".csv", _
        FileFilter:="Fichiers CSV (*.csv), *.csv", _
        Title:="Enregistrer le tableau d'amortissement")

    If filePath = "False" Then
        ' L'utilisateur a annulé
        Exit Sub
    End If

    ' Ouvrir le fichier pour écriture
    fileNum = FreeFile
    Open filePath For Output As #fileNum

    ' Écrire les données ligne par ligne
    For i = 1 To lastRow
        ligne = ""
        For j = 1 To lastCol
            cellValue = ws.Cells(i, j).Value

            ' Remplacer les points par des virgules pour les nombres (format européen)
            If IsNumeric(ws.Cells(i, j).Value) And i > 1 Then
                cellValue = Replace(CStr(cellValue), ".", ",")
            End If

            ' Ajouter des guillemets si la valeur contient une virgule ou un point-virgule
            If InStr(cellValue, ";") > 0 Or InStr(cellValue, ",") > 0 Then
                cellValue = """" & cellValue & """"
            End If

            ligne = ligne & cellValue

            ' Ajouter le séparateur (point-virgule pour CSV européen)
            If j < lastCol Then
                ligne = ligne & ";"
            End If
        Next j

        ' Écrire la ligne dans le fichier
        Print #fileNum, ligne
    Next i

    ' Fermer le fichier
    Close #fileNum

    MsgBox "Export réussi !" & vbCrLf & _
           "Fichier : " & filePath & vbCrLf & _
           lastRow & " lignes exportées.", vbInformation, "Export CSV"
End Sub

' Exporter les paramètres et résultats en CSV
Public Sub ExporterParametresCSV()
    Dim ws As Worksheet
    Dim filePath As String
    Dim fileNum As Integer

    ' Référence à la feuille de paramètres
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Parametres")
    On Error GoTo 0

    If ws Is Nothing Then
        MsgBox "La feuille 'Parametres' n'existe pas.", vbExclamation
        Exit Sub
    End If

    ' Demander où enregistrer
    filePath = Application.GetSaveAsFilename( _
        InitialFileName:="Parametres_Pret_" & Format(Now, "yyyymmdd_hhmmss") & ".csv", _
        FileFilter:="Fichiers CSV (*.csv), *.csv", _
        Title:="Enregistrer les paramètres")

    If filePath = "False" Then
        Exit Sub
    End If

    ' Ouvrir le fichier
    fileNum = FreeFile
    Open filePath For Output As #fileNum

    ' Écrire les paramètres
    Print #fileNum, "Paramètre;Valeur"
    Print #fileNum, "Montant emprunté (€);" & Replace(CStr(ws.Range("B2").Value), ".", ",")
    Print #fileNum, "Taux annuel (%);" & Replace(CStr(ws.Range("B3").Value), ".", ",")
    Print #fileNum, "Durée (années);" & ws.Range("B4").Value
    Print #fileNum, "Type d'achat;" & ws.Range("B5").Value
    Print #fileNum, ""
    Print #fileNum, "Résultats;Valeur"
    Print #fileNum, "Mensualité (€);" & Replace(CStr(ws.Range("B7").Value), ".", ",")
    Print #fileNum, "Frais de notaire (€);" & Replace(CStr(ws.Range("B8").Value), ".", ",")
    Print #fileNum, "Coût total (€);" & Replace(CStr(ws.Range("B9").Value), ".", ",")
    Print #fileNum, "Coût des intérêts (€);" & Replace(CStr(ws.Range("B10").Value), ".", ",")

    Close #fileNum

    MsgBox "Paramètres exportés avec succès !" & vbCrLf & "Fichier : " & filePath, vbInformation
End Sub

' Exporter tout (paramètres + amortissement)
Public Sub ExporterTout()
    Dim response As VbMsgBoxResult

    response = MsgBox("Voulez-vous exporter :" & vbCrLf & _
                      "- Les paramètres et résultats" & vbCrLf & _
                      "- Le tableau d'amortissement complet" & vbCrLf & vbCrLf & _
                      "Cliquez sur 'Oui' pour continuer.", vbYesNo + vbQuestion, "Export CSV")

    If response = vbYes Then
        ' Exporter les paramètres
        Call ExporterParametresCSV

        ' Exporter le tableau d'amortissement
        Call ExporterAmortissementCSV

        MsgBox "Export complet terminé !", vbInformation
    End If
End Sub

' Importer des paramètres depuis un fichier CSV
Public Sub ImporterParametresCSV()
    Dim ws As Worksheet
    Dim filePath As String
    Dim fileNum As Integer
    Dim ligne As String
    Dim elements() As String

    ' Référence à la feuille de paramètres
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Parametres")
    On Error GoTo 0

    If ws Is Nothing Then
        MsgBox "La feuille 'Parametres' n'existe pas.", vbExclamation
        Exit Sub
    End If

    ' Demander le fichier à importer
    filePath = Application.GetOpenFilename( _
        FileFilter:="Fichiers CSV (*.csv), *.csv", _
        Title:="Sélectionner le fichier de paramètres")

    If filePath = "False" Then
        Exit Sub
    End If

    ' Ouvrir et lire le fichier
    fileNum = FreeFile
    Open filePath For Input As #fileNum

    ' Lire ligne par ligne
    Dim compteur As Integer
    compteur = 0

    Do While Not EOF(fileNum)
        Line Input #fileNum, ligne

        ' Ignorer la première ligne (en-tête) et les lignes vides
        compteur = compteur + 1
        If compteur > 1 And Len(Trim(ligne)) > 0 And InStr(ligne, "Résultats") = 0 Then
            ' Séparer par point-virgule
            elements = Split(ligne, ";")

            If UBound(elements) >= 1 Then
                ' Remplacer les virgules par des points pour les nombres
                Dim valeur As String
                valeur = Replace(elements(1), ",", ".")

                ' Identifier le paramètre et l'affecter
                If InStr(elements(0), "Montant") > 0 Then
                    ws.Range("B2").Value = CDbl(valeur)
                ElseIf InStr(elements(0), "Taux") > 0 Then
                    ws.Range("B3").Value = CDbl(valeur)
                ElseIf InStr(elements(0), "Durée") > 0 Then
                    ws.Range("B4").Value = CInt(valeur)
                ElseIf InStr(elements(0), "Type") > 0 Then
                    ws.Range("B5").Value = elements(1)
                End If
            End If
        End If
    Loop

    Close #fileNum

    MsgBox "Paramètres importés avec succès !" & vbCrLf & _
           "Vous pouvez maintenant recalculer.", vbInformation
End Sub
