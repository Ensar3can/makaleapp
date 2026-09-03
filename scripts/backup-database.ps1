param(
  [string]$Instance = $(if ($env:SQLSERVER_INSTANCE) { $env:SQLSERVER_INSTANCE } else { '.\SQLEXPRESS' }),
  [string]$Database = 'aip',
  [string]$OutputDirectory = (Join-Path (Get-Location) '.data/backups')
)

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$fileName = '{0}-{1}.bak' -f $Database, $stamp
$destination = Join-Path $OutputDirectory $fileName

sqlcmd -S $Instance -E -Q "BACKUP DATABASE [$Database] TO DISK = N'$destination' WITH INIT, COPY_ONLY, STATS = 10;"
Write-Output $destination
