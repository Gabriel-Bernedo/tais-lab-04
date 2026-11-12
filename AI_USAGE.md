# Declaración de Uso de Asistentes y Agentes de IA (AI_USAGE.md)

**Curso:** Tópicos Avanzados en Ingeniería de Software — EPIS, UNSA  
**Caso:** Plataforma de Donaciones Seguras (2026) — Fundación AQP-SOLIDARIA  
**Cumplimiento:** Sección 10 de `design.md` (Uso ético y declarado de IA)

---

## 1. Registro de Asistencia de Inteligencia Artificial

| Campo | Detalle |
|---|---|
| **Herramienta / Modelo** | Google Antigravity / Gemini 3.8 Flash (DeepMind) |
| **Participantes** | Equipo de Desarrollo TAIS (Gabriel y colaboradores) |
| **Tareas asistidas** | 1. Scaffolding y configuración de la SPA en React 19 + TypeScript + Vite + Tailwind CSS 4.<br>2. Creación de los módulos backend Node.js 24 (lógica de donaciones atómicas, verificación de identidad OIDC y RBAC).<br>3. Redacción de la plantilla de infraestructura como código en AWS SAM (`template.yaml` y `frontend-template.yaml`).<br>4. Resolución del error de restricción de Service Control Policy (SCP) adaptando el despliegue a la región permitida `us-east-2`.<br>5. Corrección de la política de seguridad CSP para permitir conexión al dominio de Cognito (`*.amazoncognito.com`). |
| **Aportes IA** | - Generación de contratos y tipos TypeScript (`types/index.ts`, `backend/src/shared/types.ts`).<br>- Implementación de `TransactWriteItems` con condiciones de concurrencia para idempotencia.<br>- Configuración de CloudFront con Origin Access Control (OAC) y response headers policy.<br>- Script de aprovisionamiento de cuentas de prueba (`scripts/create-test-users.ps1`). |
| **Validación humana** | - Revisión de permisos en IAM y asignación de políticas en la consola de AWS.<br>- Validación manual del inicio de sesión OIDC en CloudFront.<br>- Pruebas visuales de interfaz en responsive (móvil y escritorio).<br>- Verificación de no inclusión de secretos en el repositorio ni variables `.env`. |
| **Limitaciones y ajustes** | - La política CSP inicial omitía el dominio `amazoncognito.com`, bloqueando el intercambio de tokens; se corrigió manualmente en la plantilla de CloudFront.<br>- Se confirmó que el User Pool de Cognito en capa gratuita no evalúa postura del dispositivo NIST, limitación documentada en el informe. |

---

## 2. Declaración de Integridad Académica
El código generado y las configuraciones de infraestructura fueron supervisados, revisados y validados por el equipo. Todos los integrantes comprenden el modelo de arquitectura Zero Trust implementado y las decisiones de diseño expuestas para la sustentación del laboratorio.

