param(
 [Parameter(Mandatory=$true)][string]$RuntimeRoot,
 [Parameter(Mandatory=$true)][string]$ProjectRef,
 [Parameter(Mandatory=$true)][string]$PublishableKey,
 [Parameter(Mandatory=$true)][string]$PdfPython,
 [int]$Port=3301
)
$ErrorActionPreference='Stop'
if($ProjectRef -notmatch '^[a-z0-9]{20}$' -or $Port -lt 1024 -or $Port -gt 65535){throw 'Invalid project reference or private port.'}
$repoRoot=Split-Path $PSScriptRoot
$trustedCa=Join-Path $RuntimeRoot 'supabase-prod-ca-2021.crt'
$env:NODE_EXTRA_CA_CERTS=$trustedCa
$env:APIP_ACCOUNT_MODE='cloud'
$env:APIP_SUPABASE_URL="https://$ProjectRef.supabase.co"
$env:APIP_SUPABASE_PUBLISHABLE_KEY=$PublishableKey
$env:APIP_ADR_POOL_SIZE='3'
$env:APIP_HOST='127.0.0.1'
$env:APIP_PORT=[string]$Port
$env:APIP_PDF_PYTHON=$PdfPython
$env:ADR_INTAKE_PROVIDER='disabled'
$env:APIP_ADR_LOG_REQUESTS='0'
$env:NODE_ENV='production'
$env:APIP_VERIFIED_SERVER_ENTRY=Join-Path $repoRoot 'dist/server.cjs'
if($env:NODE_TLS_REJECT_UNAUTHORIZED -eq '0'){throw 'Insecure TLS configuration is prohibited.'}
Set-Location -LiteralPath $RuntimeRoot
& node (Join-Path $PSScriptRoot 'hosted-preview-preflight.mjs') --prerequisites
if($LASTEXITCODE -ne 0){throw 'Fix the preflight error before entering credentials.'}
Write-Host 'Use this project Connect panel: Transaction pooler. No credentials are written to disk.'
$pooler=(Read-Host 'Transaction pooler hostname only').Trim().ToLowerInvariant()
if($pooler -notmatch '^aws-[0-9]+-ap-south-1\.pooler\.supabase\.com$'){throw 'Use the exact Mumbai transaction pooler hostname.'}
$secret=Read-Host 'Existing restricted writer password' -AsSecureString
$buffer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try{
 $encoded=[Uri]::EscapeDataString([Runtime.InteropServices.Marshal]::PtrToStringBSTR($buffer))
 $env:APIP_ADR_DATABASE_URL='postgresql://apip_adr_writer.{0}:{1}@{2}:6543/postgres' -f $ProjectRef,$encoded,$pooler
}finally{
 [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($buffer);$secret.Dispose()
 Remove-Variable encoded -ErrorAction SilentlyContinue
}
try{
 & node (Join-Path $PSScriptRoot 'hosted-preview-preflight.mjs') --launch
 if($LASTEXITCODE -ne 0){throw 'Hosted preview stopped; use the sanitized code above.'}
}finally{Remove-Item Env:APIP_ADR_DATABASE_URL -ErrorAction SilentlyContinue}
