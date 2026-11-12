import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { docClient, TABLES } from '../shared/dynamo.js';
import { successResponse, errorResponse } from '../shared/response.js';
import { getCallerContext, assertHasRole, AuthzError } from '../authz/index.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const requestId = event.requestContext.requestId;
  const projectId = event.pathParameters?.projectId;

  if (!projectId) {
    return errorResponse(400, 'BAD_REQUEST', 'Identificador de proyecto requerido', requestId);
  }

  try {
    const caller = getCallerContext(event);
    assertHasRole(caller, 'GESTOR'); // CA-08.2: Solo GESTOR publica

    const now = new Date().toISOString();

    // Actualización condicionada: status debe ser BORRADOR
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: TABLES.PROJECTS,
        Key: { projectId },
        UpdateExpression: 'SET #status = :published, #updatedAt = :now',
        ConditionExpression: 'attribute_exists(projectId) AND #status = :draft',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':published': 'PUBLICADO',
          ':draft': 'BORRADOR',
          ':now': now,
        },
        ReturnValues: 'ALL_NEW',
      })
    );

    // Registro de auditoría CA-08.3
    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLES.AUDIT,
          Item: {
            eventType: 'PROJECT_PUBLISHED',
            eventSk: `${now}#${randomUUID()}`,
            timestamp: now,
            requestId,
            actorRef: caller.sub,
            action: 'PUBLISH_PROJECT',
            resourceRef: projectId,
            outcome: 'SUCCESS',
          },
        })
      );
    } catch {}

    return successResponse(updateResult.Attributes);
  } catch (err: any) {
    if (err instanceof AuthzError) {
      return errorResponse(err.statusCode, err.code, err.message, requestId);
    }
    if (err.name === 'ConditionalCheckFailedException') {
      return errorResponse(409, 'CONFLICT', 'El proyecto ya está publicado o no existe en borrador', requestId);
    }
    return errorResponse(500, 'INTERNAL_ERROR', 'Error al publicar proyecto', requestId);
  }
}

