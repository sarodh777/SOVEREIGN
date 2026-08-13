$root = Resolve-Path "$PSScriptRoot\.."
Set-Location "$root"
Write-Host "Installing frontend dependencies in $PWD"
npm install
Write-Host "Starting frontend dev server"
npm run dev
