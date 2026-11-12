import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { docClient, TABLES } from '../shared/dynamo.js';
import { successResponse, errorResponse } from '../shared/response.js';
import { getCallerContext, assertHasRole, AuthzError } from '../authz/index.js';
import { CreateProjectSchema, Project } from '../shared/types.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const requestId = event.requestContext.requestId;

  try {
    const caller = getCallerContext(event);
    assertHasRole(caller, 'GESTOR'); // CA-08.1: Solo GESTOR crea proyectos

    const body = JSON.parse(event.body || '{}');
    const validated = CreateProjectSchema.parse(body);

    const now = new Date().toISOString();
    const projectId = `proj-${randomUUID()}`;

    const newProject: Project = {
      projectId,
      title: validated.title,
      description: validated.description,
      goalAmountCents: validated.goalAmountCents,
      confirmedAmountCents: 0,
      currency: 'PEN',
      status: 'BORRADOR', // CA-08.1: Inicia en BORRADOR
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLES.PROJECTS,
        Item: newProject,
      })
    );

    // Registro de auditoría CA-08.3
    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLES.AUDIT,
          Item: {
            eventType: 'PROJECT_CREATED',
            eventSk: `${now}#${randomUUID()}`,
            timestamp: now,
            requestId,
            actorRef: caller.sub,
            action: 'CREATE_PROJECT',
            resourceRef: projectId,
            outcome: 'SUCCESS',
          },
        })
      );
    } catch (auditErr) {
      console.warn('Advertencia: no se pudo escribir evento de auditoría', auditErr);
    }

    return successResponse(newProject, 201);
  } catch (err: any) {
    if (err instanceof AuthzError) {
      return errorResponse(err.statusCode, err.code, err.message, requestId);
    }
    if (err.name === 'ZodError') {
      return errorResponse(400, 'BAD_REQUEST', 'Datos de proyecto inválidos: ' + err.message, requestId);
    }
    return errorResponse(500, 'INTERNAL_ERROR', 'Error al crear proyecto', requestId);
  }
}

