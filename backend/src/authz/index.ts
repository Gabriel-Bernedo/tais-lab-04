import { APIGatewayProxyEventV2 } from 'aws-lambda';

export interface CallerContext {
  sub: string;
  email?: string;
  groups: string[];
}

export function getCallerContext(event: APIGatewayProxyEventV2): CallerContext {
  const claims = (event.requestContext as any)?.authorizer?.jwt?.claims;

  if (!claims || !claims.sub) {
    throw new AuthzError(401, 'UNAUTHORIZED', 'Identidad no autenticada o token ausente');
  }

  // cognito:groups puede venir como arreglo o cadena separada por espacios/comas
  let groups: string[] = [];
  const rawGroups = claims['cognito:groups'];
  if (Array.isArray(rawGroups)) {
    groups = rawGroups;
  } else if (typeof rawGroups === 'string') {
    try {
      const parsed = JSON.parse(rawGroups);
      groups = Array.isArray(parsed) ? parsed : [rawGroups];
    } catch {
      groups = rawGroups.split(/[\s,]+/);
    }
  }

  return {
    sub: claims.sub,
    email: claims.email,
    groups,
  };
}

export function assertHasRole(caller: CallerContext, requiredRole: string): void {
  if (!caller.groups.includes(requiredRole)) {
    throw new AuthzError(403, 'FORBIDDEN', `Acceso denegado: se requiere el rol ${requiredRole}`);
  }
}

export function assertOwnership(caller: CallerContext, ownerSub: string): void {
  if (caller.sub !== ownerSub) {
    // CA-07.2: Responder 403 o 404 para mitigar ataques BOLA
    throw new AuthzError(403, 'FORBIDDEN', 'Acceso denegado: el recurso pertenece a otro usuario');
  }
}

export class AuthzError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'AuthzError';
  }
}

