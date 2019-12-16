Attribute VB_Name = "my_macro"
Sub Workbook_Open()
'RLM-2018     

Application.ScreenUpdating = False

'Adress of the module
SC_adress = ThisWorkbook.Sheets("Summary").range("E42")
strModuleName = "MACRO_NAME"

'Remove "strModuleName" if already exits in destination workbook
With ThisWorkbook.VBProject.VBComponents
    On Error GoTo skip 'Capture "module does not exist" error
    .Remove .Item(strModuleName)
skip:
End With

'Import "strModuleName" from temp file
With ThisWorkbook.VBProject.VBComponents
    On Error GoTo ErrHandler
    .Import SC_adress
End With

ThisWorkbook.Save

Exit Sub

ErrHandler:
MsgBox ("Le chemin de la macro renseigné est incorrect, merci de mettre à jour ce champ concerné et rouvrir la feuille")

End Sub
