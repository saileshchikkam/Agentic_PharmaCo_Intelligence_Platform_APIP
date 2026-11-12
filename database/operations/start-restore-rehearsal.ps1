param([Parameter(Mandatory=$true)][string]$PrivateRoot,[Parameter(Mandatory=$true)][string]$Archive,[string]$PgBin='C:\Program Files\PostgreSQL\18\bin')
$ErrorActionPreference='Stop';$Host.UI.RawUI.WindowTitle='APIP OFFLINE RESTORE — RECOVERY PASSPHRASE ONLY'
$env:APIP_BACKUP_PRIVATE_ROOT=$PrivateRoot;$env:APIP_BACKUP_DIR=$Archive;$env:APIP_PG_BIN=$PgBin
Write-Host 'OFFLINE ONLY. Existing encrypted export is reused. No hosted connection, operator password or deletion.'
$secret=Read-Host 'Existing BACKUP RECOVERY passphrase only (masked)' -AsSecureString
$pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try{
 $env:APIP_BACKUP_RECOVERY_PASSWORD=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
 while($true){& node (Join-Path $PSScriptRoot 'restore-rehearsal.mjs');if($LASTEXITCODE -eq 0){break};$answer=Read-Host 'Local rehearsal stopped. Keep open. Press Enter after correction or type exit';if($answer -eq 'exit'){break}}
}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer);$secret.Dispose();Remove-Item Env:APIP_BACKUP_RECOVERY_PASSWORD -ErrorAction SilentlyContinue}
Read-Host 'Recovery passphrase cleared. Press Enter to close'
