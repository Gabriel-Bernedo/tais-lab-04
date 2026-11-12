import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../shared/dynamo.js';
import { successResponse, errorResponse } from '../shared/response.js';
import { getCallerContext, assertHasRole, AuthzError } from '../authz/index.js';
import type { Project } from '../shared/types.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const requestId = event.requestContext.requestId;

  try {
    const caller = getCallerContext(event);
    assertHasRole(caller, 'GESTOR'); // Solo GESTOR puede ver borradores y todos los proyectos

    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLES.PROJECTS,
      })
    );

    const projects = (result.Items || []) as Project[];
    return successResponse(projects);
  } catch (err: any) {
    if (err instanceof AuthzError) {
      return errorResponse(err.statusCode, err.code, err.message, requestId);
    }
    return errorResponse(500, 'INTERNAL_ERROR', 'Error al consultar proyectos del gestor', requestId);
  }
}

