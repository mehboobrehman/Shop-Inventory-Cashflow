; Shop Inventory & Account Management System Installer
; Generated Inno Setup Script

[Setup]
AppName=Shop Inventory & Account Management System
AppVersion=1.0
DefaultDirName={autopf}\ShopInventory
DefaultGroupName=ShopInventory
OutputBaseFilename=ShopInventorySetup
Compression=lzma
SolidCompression=yes
PrivilegesRequired=admin
OutputDir=userdocs:Inno Setup Output

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "..\client\dist\*"; DestDir: "{app}\client\dist"; Flags: recursesubdirs
Source: "..\server\dist\*"; DestDir: "{app}\server\dist"; Flags: recursesubdirs
Source: "..\server\prisma\*"; DestDir: "{app}\server\prisma"; Flags: recursesubdirs
Source: "..\pm2.config.js"; DestDir: "{app}"
Source: "..\package.json"; DestDir: "{app}"
Source: "installer-helpers.ps1"; DestDir: "{app}\installer"

[Icons]
Name: "{group}\ShopInventory"; Filename: "{app}\client\dist\index.html"
Name: "{commondesktop}\ShopInventory"; Filename: "{app}\client\dist\index.html"; Tasks: desktopicon

[Code]
var
  RolePage: TInputOptionWizardPage;
  NetworkPage: TInputOptionWizardPage;

function InitializeSetup(): Boolean;
var
  ResultCode: Integer;
begin
  // Check if port 4000 is available
  Exec(ExpandConstant('{sys}\netstat.exe'), '-ano | findstr /R /C:":4000 " | findstr "LISTENING"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  if ResultCode = 0 then
  begin
    MsgBox('Port 4000 is already in use. Please close the application using this port and try again.', mbError, MB_OK);
    Result := False;
    Exit;
  end;
  Result := True;
end;

procedure InitializeWizard;
begin
  RolePage := CreateInputOptionPage(wpWelcome,
    'Select Role', 'Choose the installation role',
    'Select whether to install as a Server or a Client.',
    True, False);
  RolePage.Add('Server (Backend + Frontend)');
  RolePage.Add('Client (Frontend only)');

  NetworkPage := CreateInputOptionPage(RolePage.ID,
    'Network Configuration', 'Select the network environment',
    'Choose the deployment environment.',
    True, False);
  NetworkPage.Add('Local');
  NetworkPage.Add('LAN');
  NetworkPage.Add('Cloud');
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  EnvFile: TStringList;
  Role: String;
  Network: String;
  ResultCode: Integer;
begin
  if CurStep = ssPostInstall then
  begin
    if RolePage.Values[0] then
      Role := 'server'
    else
      Role := 'client';
    
    if NetworkPage.Values[0] then
      Network := 'local'
    else if NetworkPage.Values[1] then
      Network := 'lan'
    else
      Network := 'cloud';

    // Create .env
    EnvFile := TStringList.Create;
    try
      EnvFile.Add('NODE_ENV=production');
      EnvFile.Add('NETWORK_MODE=' + Network);
      if Role = 'server' then
      begin
        EnvFile.Add('PORT=4000');
        EnvFile.Add('DATABASE_URL=file:./prisma/dev.db');
      end;
      EnvFile.SaveToFile(ExpandConstant('{app}\.env'));
    finally
      EnvFile.Free;
    end;

    // Run setup helper
    if Role = 'server' then
    begin
      if not Exec(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe'), '-ExecutionPolicy Bypass -File "' + ExpandConstant('{app}\installer\installer-helpers.ps1') + '" setup-server', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
        MsgBox('Failed to run server setup helper. ResultCode: ' + IntToStr(ResultCode), mbError, MB_OK)
      else if ResultCode <> 0 then
        MsgBox('Server setup helper finished with error. ResultCode: ' + IntToStr(ResultCode), mbError, MB_OK);
    end
    else
    begin
      if not Exec(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe'), '-ExecutionPolicy Bypass -File "' + ExpandConstant('{app}\installer\installer-helpers.ps1') + '" setup-client', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
        MsgBox('Failed to run client setup helper. ResultCode: ' + IntToStr(ResultCode), mbError, MB_OK)
      else if ResultCode <> 0 then
        MsgBox('Client setup helper finished with error. ResultCode: ' + IntToStr(ResultCode), mbError, MB_OK);
    end;
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  ResultCode: Integer;
begin
  if CurUninstallStep = usPostUninstall then
  begin
    // Run cleanup helper
    if not Exec(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe'), '-ExecutionPolicy Bypass -File "' + ExpandConstant('{app}\installer\installer-helpers.ps1') + '" cleanup', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
      MsgBox('Failed to run cleanup helper. ResultCode: ' + IntToStr(ResultCode), mbError, MB_OK)
    else if ResultCode <> 0 then
      MsgBox('Cleanup helper finished with error. ResultCode: ' + IntToStr(ResultCode), mbError, MB_OK);
  end;
end;
