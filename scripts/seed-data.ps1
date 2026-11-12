# Script para insertar datos iniciales en DynamoDB
param(
  [string]$TableName = "donations-projects-academic",
  [string]$Region = "us-east-2"
)

$projects = @(
  @{
    projectId = @{ S = "proj-001" }
    title = @{ S = "Comedores Comunitarios de Cayma" }
    description = @{ S = "Abastecimiento de alimentos de primera necesidad y menaje seguro para 3 comedores que atienden a 250 familias en Arequipa." }
    goalAmountCents = @{ N = "500000" }
    confirmedAmountCents = @{ N = "150000" }
    currency = @{ S = "PEN" }
    status = @{ S = "PUBLICADO" }
    createdAt = @{ S = "2026-11-10T12:00:00.000Z" }
    updatedAt = @{ S = "2026-11-10T12:00:00.000Z" }
  },
  @{
    projectId = @{ S = "proj-002" }
    title = @{ S = "Kits Escolares para Alto Selva Alegre" }
    description = @{ S = "Utiles escolares y mochilas ergonomicas para ninos de primaria en zonas de vulnerabilidad educativa." }
    goalAmountCents = @{ N = "300000" }
    confirmedAmountCents = @{ N = "80000" }
    currency = @{ S = "PEN" }
    status = @{ S = "PUBLICADO" }
    createdAt = @{ S = "2026-11-11T12:00:00.000Z" }
    updatedAt = @{ S = "2026-11-11T12:00:00.000Z" }
  },
  @{
    projectId = @{ S = "proj-003" }
    title = @{ S = "Posta Medica Itinerante Cerro Colorado" }
    description = @{ S = "Campanas de despistaje preventivo y botiquines comunales con personal voluntario de salud." }
    goalAmountCents = @{ N = "800000" }
    confirmedAmountCents = @{ N = "0" }
    currency = @{ S = "PEN" }
    status = @{ S = "BORRADOR" }
    createdAt = @{ S = "2026-11-12T12:00:00.000Z" }
    updatedAt = @{ S = "2026-11-12T12:00:00.000Z" }
  }
)

Write-Host "Insertando proyectos semilla en DynamoDB..." -ForegroundColor Cyan

foreach ($p in $projects) {
  $id = $p.projectId.S
  $json = $p | ConvertTo-Json -Compress
  aws dynamodb put-item --table-name $TableName --item $json --region $Region
  Write-Host "-> Proyecto $id insertado con exito." -ForegroundColor Green
}

Write-Host "Listo! Proyectos sembrados correctamente." -ForegroundColor Green

