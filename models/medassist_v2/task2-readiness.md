# DDXPlus Task 2 local data readiness — 2026-10-19

**Status: BLOCKED for real-data profiling; loader/simulator synthetic checks are available.** APIP_MEDASSIST_V2_ROOT was unset. The two dedicated candidate research directories named medassist-v2 and medassist-v2-ddxplus under local APIP research storage were absent. This was a bounded check, not a search of the entire computer. No archives were downloaded and no real row counts, class coverage, distributions, partition/group independence or model results are claimed.

All five pinned files are missing from a configured v2 bundle:

- release_evidences.json
- release_conditions.json
- release_train_patients.zip
- release_validate_patients.zip
- release_test_patients.zip

Exact official URLs, sizes and publisher MD5 values are in the unchanged [English v2 manifest](dataset-manifest.json). Source: [official versioned Figshare metadata](https://api.figshare.com/v2/articles/22687585/versions/2), [author documentation](https://github.com/mila-iqia/ddxplus). Task 1 recorded CC BY 4.0; preserve attribution/licence/change notices. This task did not refresh/download those source files. No restricted source is required.

## Manual acquisition instructions — not executed

From the repository root, deliberately choose a new persistent unsynced local directory outside Git/served paths. If LOCALAPPDATA is virtualized by your shell, choose the actual persistent location explicitly; do not accidentally reuse another environment. Use the pinned URLs, not a different release. These commands download public files only when the operator runs them:

```powershell
$env:APIP_MEDASSIST_V2_ROOT = Join-Path $env:LOCALAPPDATA 'APIP\research\medassist-v2-ddxplus'
$env:PYTHONDONTWRITEBYTECODE = '1'
python -c "import os; from models.medassist_v2.storage import external_path; external_path(os.environ['APIP_MEDASSIST_V2_ROOT'])"
if ($LASTEXITCODE -ne 0) { throw 'Research path rejected' }
if (Test-Path -LiteralPath $env:APIP_MEDASSIST_V2_ROOT) { throw 'Select a new empty research directory; preserve existing data' }
New-Item -ItemType Directory -Path $env:APIP_MEDASSIST_V2_ROOT | Out-Null
$sourceManifest = Get-Content -Raw models/medassist_v2/dataset-manifest.json | ConvertFrom-Json
foreach ($sourceFile in $sourceManifest.files) {
    $targetFile = Join-Path $env:APIP_MEDASSIST_V2_ROOT $sourceFile.name
    Invoke-WebRequest -Uri $sourceFile.url -OutFile $targetFile -ErrorAction Stop
    if ((Get-Item -LiteralPath $targetFile).Length -ne $sourceFile.bytes) { throw 'Source size mismatch' }
    if ((Get-FileHash -LiteralPath $targetFile -Algorithm MD5).Hash.ToLowerInvariant() -ne $sourceFile.publisher_reported_md5) { throw 'Source checksum mismatch' }
}
python -W error -m models.medassist_v2 readiness --root $env:APIP_MEDASSIST_V2_ROOT
if ($LASTEXITCODE -ne 0) { throw 'Readiness blocked; preserve files and investigate' }
```

Do not extract, rename partitions or place source files in the repository. Interrupted downloads must be inspected/preserved; these instructions refuse an existing directory rather than overwriting a prior run. Readiness reports observed SHA-256 values; retain those and the exact manifest externally before a later study. Changed source metadata/file hashes require review, not a bypass.

Remaining gates: validate actual file/header/evidence metadata conventions and expansion limits; review conservative unknown-versus-default semantics; inspect permitted aggregate class/missingness and cross-partition duplicate/family risks without moving source assignments; measure corpus runtime/memory; define a separate experiment. No urgency references, clinical validity or training readiness follow from file verification.
