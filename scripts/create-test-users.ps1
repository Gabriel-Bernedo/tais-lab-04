# Script para aprovisionar usuarios de prueba en Amazon Cognito (Zero Trust - UNSA 2026)
param(
  [string]$UserPoolId = "us-east-2_yokyVErm5",
  [string]$Region = "us-east-2",
  [string]$DefaultPassword = "Password123!"
)

$users = @(
  @{ Email = "donante@aqp-solidaria.org"; Group = "DONANTE" },
  @{ Email = "gestor@aqp-solidaria.org"; Group = "GESTOR" },
  @{ Email = "auditor@aqp-solidaria.org"; Group = "AUDITOR" }
)

Write-Host "=== Aprovisionando usuarios de prueba en Cognito ($UserPoolId) ===" -ForegroundColor Cyan

foreach ($u in $users) {
  $email = $u.Email
  $group = $u.Group

  Write-Host "`nCreando usuario: $email con grupo $group..." -ForegroundColor Yellow

  # 1. Crear usuario
  aws cognito-idp admin-create-user `
    --user-pool-id $UserPoolId `
    --username $email `
    --user-attributes Name=email,Value=$email Name=email_verified,Value=true `
    --message-action SUPPRESS `
    --region $Region

  # 2. Establecer contraseña permanente
  aws cognito-idp admin-set-user-password `
    --user-pool-id $UserPoolId `
    --username $email `
    --password $DefaultPassword `
    --permanent `
    --region $Region

  # 3. Asignar al grupo correspondiente (DONANTE, GESTOR, AUDITOR)
  aws cognito-idp admin-add-user-to-group `
    --user-pool-id $UserPoolId `
    --username $email `
    --group-name $group `
    --region $Region

  Write-Host "-> Usuario $email listo y asociado al rol $group." -ForegroundColor Green
}

Write-Host "`n=== Todos los usuarios fueron creados exitosamente ===" -ForegroundColor Green
Write-Host "Contraseña predeterminada: $DefaultPassword"

