# Informe Técnico de Laboratorio: Plataforma de Donaciones Seguras (2026)

**Curso:** Tópicos Avanzados en Ingeniería de Software (TAIS)  
**Institución:** Escuela Profesional de Ingeniería de Software — Universidad Nacional de San Agustín (UNSA)  
**Caso:** Fundación AQP-SOLIDARIA (Prototipo Académico de Donaciones Simuladas)  
**Enfoque de Seguridad:** Arquitectura Zero Trust (NIST SP 800-207)  
**Ambiente Cloud:** AWS Free Plan (`us-east-2`, Ohio)  

---

## 1. Resumen Ejecutivo y Alcance

El presente laboratorio implementa una plataforma de recaudación social para la fundación ficticia «Fundación AQP-SOLIDARIA», cuyo objetivo es permitir la publicación transparente de causas comunitarias (educación, salud y alimentación) y la recepción de intenciones de donación auditables.

Siguiendo las restricciones pedagógicas del curso, **no se procesan pagos reales ni se almacenan credenciales bancarias ni tarjetas de crédito**. El núcleo de la solución radica en demostrar un modelo de seguridad robusto basado en **Zero Trust (NIST SP 800-207)**, garantizando que ninguna solicitud sea confiable por su origen de red y que cada acceso individual sea autenticado, autorizado e idempotente en el servidor.

---

## 2. Arquitectura de la Solución

La solución adopta un patrón **Cloud-Native Serverless Modular**:

```
[ Navegador / Cliente ]
         │ (HTTPS + TLS 1.3)
         ▼
[ Amazon CloudFront + OAC ] ───▶ [ S3 Bucket Privado (SPA React 19) ]
         │ (Cabeceras CSP, HSTS, X-Frame-Options)
         ▼
[ Amazon Cognito User Pool ] ◀── PKCE + Auth Code (MFA TOTP)
         │ (JWT Access Token ≤ 15 min)
         ▼
[ API Gateway HTTP API ] ─────── PEP (Policy Enforcement Point)
         │ (Valida firma, emisor, expiración y scopes)
         ▼
[ AWS Lambda (Node.js 24) ] ──── PDP (Policy Decision Point: RBAC + Ownership)
         │ (Mínimo privilegio IAM por función)
         ▼
[ Amazon DynamoDB ] ─────────── Tablas: Projects, Donations, Idempotency, Audit
                                (Atomicidad con TransactWriteItems)
```

### Componentes Clave:
1. **Frontend (SPA):** Desarrollado con **React 19**, **TypeScript**, **Vite** y **Tailwind CSS 4**. Se compila como sitio estático alojado en un bucket privado de **Amazon S3**, expuesto exclusivamente mediante **Amazon CloudFront** con **Origin Access Control (OAC)** y una política de cabeceras de respuesta de alta seguridad (CSP, HSTS).
2. **Identidad y Autenticación:** **Amazon Cognito User Pool** configurado con flujo *Authorization Code + PKCE*. Soporta MFA TOTP para roles privilegiados (`GESTOR` y `AUDITOR`) y emite Access Tokens de vida corta ($\le$ 15 minutos).
3. **Backend Serverless:** **API Gateway HTTP API** actúa como el primer anillo de defensa (PEP), evaluando el JWT de Cognito y los scopes de acceso (`api/projects.write`, `api/donations.write`, `api/donations.read`). El cómputo en **AWS Lambda (Node.js 24)** actúa como PDP ejecutando lógica de dominio y validación de propiedad (*ownership*).
4. **Almacenamiento e Idempotencia:** **Amazon DynamoDB** (capacidad On-Demand) almacena proyectos, intenciones de donación y registros de idempotencia. La creación y simulación de aportes utiliza `TransactWriteItems` condicionado para impedir doble conteo o condiciones de carrera concurrentes.

---

## 3. Mapeo a los Componentes y Principios Zero Trust (NIST SP 800-207)

### 3.1 Componentes Lógicos del NIST
* **Policy Enforcement Point (PEP):** Implementado en la frontera por **Amazon API Gateway HTTP API** con JWT Authorizer y por **Amazon CloudFront** en el frontend.
* **Policy Decision Point (PDP) / Policy Engine (PE):** Implementado en el módulo backend `authz` en AWS Lambda, el cual inspecciona los claims verificados (`cognito:groups`, `sub`) y el estado del recurso en DynamoDB.
* **Policy Administrator (PA):** **Amazon Cognito**, responsable de la emisión, renovación y revocación de tokens de sesión.
* **Policy Information Points (PIP):** Claims del token JWT, registros persistidos en DynamoDB y bitácoras de auditoría en CloudWatch Logs / CloudTrail.

### 3.2 Los 7 Principios de NIST SP 800-207
1. **Todos los orígenes de datos y servicios informáticos se consideran recursos:** Cada endpoint del API y cada tabla DynamoDB tiene una política de acceso explícita.
2. **Todas las comunicaciones se protegen independientemente de la ubicación de red:** No existe confianza implícita por red interna; todo tráfico hacia CloudFront y API Gateway viaja por TLS/HTTPS.
3. **El acceso a recursos individuales se concede por sesión:** Los tokens tienen una vigencia máxima de 15 minutos. No existen permisos globales persistentes.
4. **El acceso se determina por una política dinámica:** Se evalúa de manera simultánea la identidad (`sub`), el rol (`cognito:groups`), el estado del recurso (`PUBLICADO` vs `BORRADOR`) y el stage (`academic`).
5. **La organización supervisa la integridad y postura de los activos:** Mitigado mediante auditoría de dependencias en CI/CD y registro de accesos en CloudTrail (limitación declarada del Free Tier: sin Verified Access).
6. **Toda autenticación y autorización es estricta y dinámica antes de permitir el acceso:** Doble verificación: firma y scopes en API Gateway, seguido de verificación de rol y pertenencia en Lambda.
7. **La organización recopila la mayor cantidad de información posible sobre la postura de red:** Logs estructurados en JSON con correlación `requestId` almacenados con retención de 14 días en CloudWatch Logs.

---

## 4. Evidencia de Cumplimiento de Pruebas Negativas y Casos de Aceptación

| Test ID | Escenario Evaluado | Resultado Esperado | Implementación y Evidencia |
|---|---|---|---|
| **T01** | Visitante consulta proyectos | 200 OK (solo proyectos `PUBLICADO`) | Query en GSI `StatusCreatedAtIndex` con `#status = 'PUBLICADO'`. |
| **T02** | Donación sin token de autenticación | 401 Unauthorized | API Gateway JWT Authorizer bloquea la petición antes de Lambda. |
| **T03** | Donante intenta crear proyecto | 403 Forbidden | Lambda evalúa `assertHasRole(caller, 'GESTOR')` y deniega la acción. |
| **T04** | Importe inválido (0, > S/ 1000 o decimales flotantes) | 400 Bad Request | Esquema Zod valida `amountCents` como entero en rango [100, 100000]. |
| **T05** | Donante registra intención válida | 201 Created (`PENDIENTE_SIMULACION`) | Se genera registro en DynamoDB sin solicitar datos de pago reales. |
| **T06** | Repetición de misma clave y payload idéntico | Mismo resultado (idempotente) | Búsqueda previa en tabla `Idempotency`; retorna la respuesta en caché. |
| **T07** | Reutilización de clave con diferente payload | 409 Conflict | Se detecta discrepancia en el hash SHA-256 del cuerpo y se rechaza. |
| **T08** | 10 confirmaciones concurrentes de la misma donación | Un único incremento en el total | `TransactWriteItems` con condición `status = 'PENDIENTE_SIMULACION'`. |
| **T09** | Donante consulta donación ajena (BOLA / IDOR) | 403 Forbidden | Verificación de pertenencia (`donorSub === caller.sub`). |
| **T10** | Función de listado intenta escribir en DynamoDB | AccessDenied por IAM | Rol IAM de `ProjectsListFunction` limitado a `dynamodb:Query`. |
| **T11** | Uso de token alterado o sin scopes | 401 Unauthorized | JWT Authorizer valida firma criptográfica y scopes requeridos. |
| **T12** | Gestor consulta historial de donante | 403 Forbidden | Endpoint `/v1/donations/me` exige rol `DONANTE`. |
| **T13** | Uso de token revocado | Válido hasta su expiración ($\le$ 15 min) | Limitación documentada de JWT stateless en API Gateway. |
| **T14** | Usuario GESTOR sin segundo factor (MFA) | Bloqueo de emisión de tokens | Flujo MFA TOTP requerido en Cognito. |

---

## 5. Limitaciones Declaradas del Entorno Cloud (AWS Free Plan)

1. **Ventana de Exposición de Tokens:** El autorizador JWT de API Gateway valida firma y expiración de forma local sin consultar una lista de revocación en tiempo real. Un token revocado se considera válido hasta su expiración ($\le$ 15 min). La mitigación adoptada es el uso de tokens de vida corta.
2. **Ausencia de Postura de Dispositivo (ZTNA):** Servicios como AWS Verified Access, AWS GuardDuty o AWS Security Hub no están incluidos en la capa gratuita y quedaron fuera del alcance.
3. **Restricción Regional por SCP:** La cuenta de AWS cuenta con una *Service Control Policy* institucional que restringe el aprovisionamiento de recursos a la región **`us-east-2` (Ohio)**. La arquitectura se adaptó de forma transparente para operar bajo esta restricción.

---

## 6. Enlaces y Recursos del Proyecto

* **Frontend Web en Producción (CloudFront):** [https://d4twnz6gxwdr2.cloudfront.net](https://d4twnz6gxwdr2.cloudfront.net)
* **Backend API Gateway (Stage Academic):** `https://o2ngnz0ma9.execute-api.us-east-2.amazonaws.com/academic`
* **Especificación OpenAPI 3.1:** [`docs/api.yaml`](./docs/api.yaml)
* **Modelo de Amenazas STRIDE:** [`docs/threat-model.md`](./docs/threat-model.md)
* **Declaración de Asistencia de IA:** [`AI_USAGE.md`](./AI_USAGE.md)
