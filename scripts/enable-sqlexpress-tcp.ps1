# Enables TCP/IP on the local SQLEXPRESS instance so Prisma can connect.
# Run from an elevated PowerShell:  powershell -ExecutionPolicy Bypass -File scripts/enable-sqlexpress-tcp.ps1

$ErrorActionPreference = 'Stop'

$tcpKey = 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL15.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp'
$ipAllKey = 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL15.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp\IPAll'

if (-not (Test-Path $tcpKey)) {
  throw "SQLEXPRESS TCP registry key not found: $tcpKey"
}

Set-ItemProperty -Path $tcpKey -Name Enabled -Value 1
Set-ItemProperty -Path $ipAllKey -Name TcpPort -Value '1433'
Set-ItemProperty -Path $ipAllKey -Name TcpDynamicPorts -Value ''

Restart-Service -Name 'MSSQL$SQLEXPRESS' -Force
Start-Sleep -Seconds 3

$probe = Get-NetTCPConnection -LocalPort 1433 -State Listen -ErrorAction SilentlyContinue
if (-not $probe) {
  throw 'SQLEXPRESS did not listen on TCP 1433 after restart. Check SQL Server error log.'
}

Write-Host 'SQLEXPRESS is listening on TCP 1433.'
