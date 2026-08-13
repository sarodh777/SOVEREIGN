$root = Resolve-Path "$PSScriptRoot\.."
Set-Location "$root\backend"
Write-Host "Starting backend in $PWD"
.\mvnw.cmd spring-boot:run
