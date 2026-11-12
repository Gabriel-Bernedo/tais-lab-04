# Plataforma de Donaciones Seguras (2026) — Fundación AQP-SOLIDARIA

Proyecto desarrollado para el curso **Tópicos Avanzados en Ingeniería de Software (UNSA)**.
Implementación cloud-native serverless alineada con el modelo de seguridad **Zero Trust (NIST SP 800-207)**.

---

## 🌐 URLs Públicas en Producción (AWS)

* 🔗 **Frontend Web (SPA en CloudFront):**  
  👉 **[https://d4twnz6gxwdr2.cloudfront.net](https://d4twnz6gxwdr2.cloudfront.net)**
* 🔗 **Backend API Gateway (Stage Academic):**  
  `https://o2ngnz0ma9.execute-api.us-east-2.amazonaws.com/academic`

---

## ☁️ Arquitectura e Infraestructura Desplegada

* **Región:** `us-east-2` (Ohio)
* **Frontend:** S3 privado (`aqp-solidaria-frontend-063659476602`) + CloudFront con **Origin Access Control (OAC)** y políticas de cabeceras de seguridad (HSTS, CSP, X-Frame-Options, X-Content-Type-Options).
* **Amazon Cognito User Pool:** `us-east-2_yokyVErm5`
* **Client ID (SPA):** `itg4bnk65ogv7is4krsdfgkf5`
* **Authority OIDC:** `https://cognito-idp.us-east-2.amazonaws.com/us-east-2_yokyVErm5`

### Tablas DynamoDB (On-Demand / Free Tier)
* `donations-projects-academic`: Catálogo y gestión de proyectos comunitarios.
* `donations-donations-academic`: Registro de intenciones e historial de donaciones.
* `donations-idempotency-academic`: Almacén atómico de idempotencia (`Idempotency-Key`) con TTL de 24 horas.
* `donations-audit-academic`: Bitácora inmutable de eventos de auditoría.

---

## 👥 Cuentas de Prueba Creadas (Cognito)

| Rol | Correo | Contraseña | Capacidades |
|---|---|---|---|
| **DONANTE** | `donante@aqp-solidaria.org` | `Password123!` | Crear intenciones de donación, simular confirmación propia, ver historial privado. |
| **GESTOR** | `gestor@aqp-solidaria.org` | `Password123!` | Crear causas en `BORRADOR` y publicar proyectos (`PUBLICADO`). |
| **AUDITOR** | `auditor@aqp-solidaria.org` | `Password123!` | Consultar bitácora de auditoría. |

*(Nota: En la interfaz web también cuentas con el selector de roles para alternar con un solo clic si deseas probar en modo demostración local o remota).*

---

## 🛡️ Controles Zero Trust Demostrados

1. **Confidencialidad en Tránsito y Headers (RNF-HU-01 / RNF-HU-11):** Entrega exclusivamente por HTTPS con HSTS, CSP estricta, `X-Content-Type-Options: nosniff` y `X-Frame-Options: DENY`.
2. **Tokens en Memoria (CA-NF11.1):** No se guardan credenciales ni tokens en `localStorage`/`sessionStorage`.
3. **Vida Corta de Tokens (CA-03.3):** Access tokens con vigencia $\le$ 15 minutos emitidos por Cognito con PKCE.
4. **Idempotencia Atómica (CA-05.4 / RNF-HU-04):** `POST /v1/donations` exige `Idempotency-Key` (UUID) y bloquea condiciones de carrera con `TransactWriteItems`.
5. **Mínimo Privilegio IAM (RNF-HU-03):** Funciones Lambda aisladas con roles específicos por endpoint y tabla DynamoDB.
6. **Mitigación BOLA (CA-07.2):** Validación de identidad por claims verificados y comprobación de pertenencia de recurso en backend.
