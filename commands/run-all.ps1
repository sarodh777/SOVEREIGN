$root = Resolve-Path "$PSScriptRoot\.."

Start-Process pwsh -ArgumentList "-NoExit", "-Command", "Set-Location '$root\\backend'; .\\mvnw.cmd spring-boot:run"
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "Set-Location '$root'; npm install; npm run dev"
