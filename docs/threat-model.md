# Modelo de Amenazas (STRIDE) y Mapeo NIST SP 800-207

**Proyecto:** Plataforma de Donaciones Seguras (2026) — Fundación AQP-SOLIDARIA  
**Modelo de Seguridad:** Zero Trust Architecture (ZTA)

---

## 1. Análisis de Amenazas STRIDE

| Categoría | Amenaza Identificada | Control de Mitigación Implementado | Evidencia / Validación |
|---|---|---|---|
| **Spoofing (Suplantación)** | Un atacante envía solicitudes haciéndose pasar por donante o gestor sin credenciales válidas. | Autenticación obligatoria mediante Amazon Cognito User Pool con flujo Authorization Code + PKCE. JWT Authorizer en API Gateway valida firma, emisor y expiración. | Respuestas 401 Unauthorized ante tokens inválidos o ausentes. |
| **Tampering (Manipulación)** | Alteración de los montos de donación o intento de enviar dinero fraccionario o negativo en la petición HTTP. | Validación estricta con esquemas Zod en Lambda. Dinero representado en céntimos enteros (`amountCents` entre 100 y 100,000 PEN). | CA-05.2 / Error 400 Bad Request. |
| **Repudiation (Repudio)** | Un donante o gestor niega haber publicado un proyecto o registrado una intención. | Generación de eventos inmutables en la tabla `AuditEvents` correlacionados con `requestId` y `sub` verificado. | Tabla DynamoDB `donations-audit-academic`. |
| **Information Disclosure (Fuga de información)** | Acceso no autorizado al historial privado de otros donantes (BOLA / IDOR) o secretos en frontend. | Verificación de propiedad (*ownership check*) en Lambda (`authz`), tokens mantenidos exclusivamente en memoria (`sessionStorage`), y ausencia de credenciales AWS en código. | CA-07.2 / Respuestas 403 Forbidden sin fuga de datos. |
| **Denial of Service (Denegación de servicio / Carrera)** | Solicitudes concurrentes repetidas para duplicar la recaudación de un proyecto. | Idempotencia atómica mediante `Idempotency-Key` (UUID) y operaciones transaccionales condicionadas con `TransactWriteItems`. | CA-05.4 y CA-06.2. |
| **Elevation of Privilege (Elevación de privilegios)** | Un donante intenta crear o publicar proyectos sociales reservados para la administración. | Control de acceso basado en roles (RBAC) derivado del claim verificado `cognito:groups`. El backend rechaza peticiones no autorizadas. | CA-04.1 / Error 403 Forbidden. |

---

## 2. Mapeo a los 7 Principios de NIST SP 800-207

| Principio NIST | Implementación Técnica en la Arquitectura |
|---|---|
| **1. Todo dato y servicio es un recurso** | Cada ruta de API Gateway y cada tabla de DynamoDB está aislada con políticas explícitas de acceso. |
| **2. Comunicación segura sin importar la red** | Cifrado en tránsito obligatorio (HTTPS/TLS) tanto en CloudFront (SPA) como en API Gateway (REST API). No se expone ningún puerto HTTP. |
| **3. Acceso por sesión y recurso individual** | Access tokens de vida corta ($\le$ 15 min). La autorización se evalúa por recurso específico en cada petición. |
| **4. Política dinámica y contextual** | La decisión de acceso combina identidad (`sub`), grupo (`cognito:groups`), estado del proyecto (`PUBLICADO`) y stage (`academic`). |
| **5. Monitoreo de la postura de activos** | *Limitación declarada del Free Tier:* No se cuenta con ZTNA/Verified Access ni inspección de dispositivo. Mitigado con dependencias auditadas y MFA. |
| **6. Autenticación y autorización estrictas** | Arquitectura desacoplada: API Gateway actúa como **PEP** (Policy Enforcement Point) y Lambda como **PDP** (Policy Decision Point). |
| **7. Recolección continua de información** | Registro estructurado en JSON hacia CloudWatch Logs y auditoría de cambios con AWS CloudTrail. |

