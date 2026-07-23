$file = 'd:\download\PRJ301_Project-main\PRJ301_Project-main\src\AdminApp.jsx'
$lines = Get-Content $file
$kept = $lines[0..2696] + $lines[2830..($lines.Length-1)]
$kept | Set-Content $file -Encoding UTF8
Write-Host ('Done. Lines: ' + $kept.Length)
