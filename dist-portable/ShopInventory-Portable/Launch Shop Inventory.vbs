Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strScriptPath = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strScriptPath
WshShell.Run """" & strScriptPath & "\start-server.bat""", 0, False
Set WshShell = Nothing
Set fso = Nothing
