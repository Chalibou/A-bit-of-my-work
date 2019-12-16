Attribute VB_Name = "my_macro"
Sub PMFUP_table_generator()
'RLM-2018                                       '

'#Optimisation
Application.ScreenUpdating = False
On Error GoTo ErrHandler

'#Preliminaries
'Recuperation of application parameters
Dim init_Date, end_Date As Date
init_Date = Sheets("Macro Parameters").range("B2")
end_Date = Sheets("Macro Parameters").range("B3")

'Handle user input error
If Not IsDate(init_Date) Or Not IsDate(init_Date) Or IsEmpty(init_Date) Or IsEmpty(end_Date) Or init_Date > end_Date Then
    Err.Description = "Dates invalides"
    GoTo ErrHandler
End If

'Creation of ListObjects
Dim LO_RateFUP, LO_Resource, LO_PMFUP As ListObject
'Set ListObject pointer to the tables
Set LO_RateFUP = Sheets("RateFUP").ListObjects("Tbl_RateFUP")
Set LO_Resource = Sheets("Resources").ListObjects("Tbl_Resource")
Set LO_PMFUP = Sheets("PeopleMonthlyFUP").ListObjects("Tbl_PeopleMonthlyRate")

'Array creation for table processing
Dim Array_RateFUP()
Dim Array_Resource()
Dim Array_PMFUP() 'PeopleMonthlyFUP

'Copy tables in arrays
Array_RateFUP = LO_RateFUP.DataBodyRange.Value
Array_Resource = LO_Resource.DataBodyRange.Value

'Array creation for application purpose
Dim Array_ItemList()
Dim Array_ResourceList()
'Fill application purpose arrays
Array_ItemList = extractList(Array_RateFUP, 1)
Array_ResourceList = extractList(Array_Resource, 1)

'#Processing
'1-For each resource in table we check for rateItem history
'2-We fill Array_PMFUP by month interation beginning from init_date to end_date
'3-For each iteration we check Resource rateItem throught reteItem history
'4-RateItem throught RateFUP array gives current rate to apply

For i = 1 To UBound(Array_ResourceList, 1)

    '1-Agregate Resource's rateItem history
    Dim ress_ms_name, ress_sph_name, ress_section As String
    ress_ms_name = Array_ResourceList(i)
    
    Dim rateItem_hystory()
    k = 1
    ReDim rateItem_hystory(1 To 2, 1 To 1) 'To be sure this array will allways have a 2 x k dimension
    For j = 1 To UBound(Array_Resource, 1)
        If ress_ms_name = Array_Resource(j, 1) Then
            ress_sph_name = Array_Resource(j, 3)
            ress_section = Array_Resource(j, 10)
            ReDim Preserve rateItem_hystory(1 To 2, 1 To k + 1)
            rateItem_hystory(1, k + 1) = Array_Resource(j, 8) 'Date of change
            rateItem_hystory(2, k + 1) = Array_Resource(j, 9) 'RateItem
            k = k + 1
        End If
    Next j
    'Transpose array for better follow-up (Redim preserve operation only work for last dimension of an array)
    rateItem_hystory = Application.Transpose(rateItem_hystory)
    ' --!-- Sorting the array may be usefull
    
    '2-Fill Array_PMFUP from init_Date to end_Date
    month_delta = Month(end_Date) - Month(init_Date) + 12 * (Year(end_Date) - Year(init_Date)) + 1 'Get the total number of month between end_Date and init_Date
    k = 1
    Dim buffer_date As Date
    buffer_date = init_Date 'Save init_date in buffer for loop usage
    
    For j = 1 To month_delta
        ReDim Preserve Array_PMFUP(1 To 9, 1 To (i - 1) * month_delta + k) 'Yep.. actual position in Array_PMFUP array within the for i loop is (i - 1) * month_delta + k
        Array_PMFUP(1, (i - 1) * month_delta + k) = ress_ms_name 'MSName of resource
        Array_PMFUP(2, (i - 1) * month_delta + k) = ress_sph_name 'SPHName of ressource
        Array_PMFUP(3, (i - 1) * month_delta + k) = ress_section 'Section of ressource
        Array_PMFUP(5, (i - 1) * month_delta + k) = Year(buffer_date) 'Year
        Array_PMFUP(6, (i - 1) * month_delta + k) = Month(buffer_date) 'Month
        Array_PMFUP(7, (i - 1) * month_delta + k) = Year(buffer_date) & Format(Month(buffer_date), "00") 'Expected format
        Array_PMFUP(9, (i - 1) * month_delta + k) = ress_ms_name & Array_PMFUP(7, (i - 1) * month_delta + k) 'KeyRate
        
                '3-Check the current rateItem regarding buffer_Date
        For m = 1 To UBound(rateItem_hystory, 1)
            If buffer_date >= rateItem_hystory(m, 1) Then
                Array_PMFUP(4, (i - 1) * month_delta + k) = rateItem_hystory(m, 2)
            End If
        Next m
        
        '4-Get the RateItem throught RateFUP array
        For n = 1 To UBound(Array_RateFUP, 1)
            If Array_PMFUP(4, (i - 1) * month_delta + k) = Array_RateFUP(n, 1) And Array_RateFUP(n, 2) = Year(buffer_date) Then
                Array_PMFUP(8, (i - 1) * month_delta + k) = Array_RateFUP(n, 7) 'RateValue
                Exit For
            End If
        Next n
        
        buffer_date = DateAdd("m", 1, buffer_date)
        k = k + 1
    Next j
Next i

Array_PMFUP = Application.Transpose(Array_PMFUP) 'Transpose due to redim preserve limitations

'#Data visualization
'Clean PeopleMonthlyFUP table
If LO_PMFUP.InsertRowRange Is Nothing Then
    LO_PMFUP.DataBodyRange.ClearContents
    LO_PMFUP.DataBodyRange.Delete
End If

'For unknown reasons adding one line below the header
'applies the format header to the data, so we create two
'dummies lines that we erase thereafter
LO_PMFUP.Resize range("A1:I3")

'Put Array_PMFUP into PeopleMonthlyFUP table
For i = 1 To UBound(Array_PMFUP, 1)
    Dim newrow As ListRow
    Set newrow = LO_PMFUP.ListRows.Add
    With newrow
        .range(1) = Array_PMFUP(i, 1)
        .range(2) = Array_PMFUP(i, 2)
        .range(3) = Array_PMFUP(i, 3)
        .range(4) = Array_PMFUP(i, 4)
        .range(5) = Array_PMFUP(i, 5)
        .range(6) = Array_PMFUP(i, 6)
        .range(7) = Array_PMFUP(i, 7)
        .range(8) = Array_PMFUP(i, 8)
        .range(9) = Array_PMFUP(i, 9)
    End With
Next i

'We erase the lines we created for visual purpose
LO_PMFUP.range.Rows("2:3").Delete

Exit Sub
'Error hadler
ErrHandler:
MsgBox "Une erreur s'est produite : " & Err.Description
End Sub


'###Extract synthetized data from a column of an array into a list
Function extractList(ByVal inputArray As Variant, ByVal range As Integer) As Variant
'Init returned value
Dim bufferList()
'Fill the list
k = 1
ReDim Preserve bufferList(1 To 1)
bufferList(1) = inputArray(1, range)
For i = 1 To UBound(inputArray, 1)
    For j = 1 To UBound(bufferList, 1)
        If inputArray(i, range) = bufferList(j) Then 'If already present then useless to go along this iteration
            Exit For
        Else
            If j = UBound(bufferList, 1) Then 'If not found and "End of the list" the we add this item to the list
                k = k + 1
                ReDim Preserve bufferList(1 To k)
                bufferList(k) = inputArray(i, range)
            End If
        End If
    Next j
Next i
'Return result
extractList = bufferList
End Function
