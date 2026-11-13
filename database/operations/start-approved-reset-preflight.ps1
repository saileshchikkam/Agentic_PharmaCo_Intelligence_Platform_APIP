param([Parameter(Mandatory=$true)][string]$PrivateRoot,[Parameter(Mandatory=$true)][string]$Archive,[Parameter(Mandatory=$true)][string]$SecondCopy)
$ErrorActionPreference='Stop';$Host.UI.RawUI.WindowTitle='APIP APPROVED RESET — PRIVATE PREFLIGHT'
$env:APIP_RESET_PRIVATE_ROOT=$PrivateRoot;$env:APIP_RESET_ARCHIVE=$Archive;$env:APIP_RESET_SECOND_COPY=$SecondCopy
function Read-Private([string]$label){$secret=Read-Host $label -AsSecureString;$pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret);try{return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer);$secret.Dispose()}}
Write-Host 'Project kstxwoitiistmvivwixd — exact owner-approved development reset only.'
Write-Host 'Preflight checks both encrypted copies, recovery and Auth Admin read authorization before any deletion.'
Write-Host 'Do not enter a database password. The API key must be this project secret/service_role key, not a publishable key.'
try{
 $env:APIP_RESET_RECOVERY_PASSWORD=Read-Private 'Existing BACKUP RECOVERY passphrase (masked)'
 $env:APIP_RESET_AUTH_ADMIN_KEY=Read-Private 'Supabase server-only SECRET/service_role API key (masked)'
 & node (Join-Path $PSScriptRoot 'approved-reset-auth-worker.mjs')
 if($LASTEXITCODE -ne 0){Write-Host 'Stopped. Do not retry automatically; share only the sanitized stage/code.'}
}finally{Remove-Item Env:APIP_RESET_AUTH_ADMIN_KEY -ErrorAction SilentlyContinue;Remove-Item Env:APIP_RESET_RECOVERY_PASSWORD -ErrorAction SilentlyContinue}
$Host.UI.RawUI.WindowTitle='APIP RESET — STOPPED — CREDENTIALS CLEARED'
Read-Host 'Secrets cleared. This is NOT a password prompt. Press Enter to close'
