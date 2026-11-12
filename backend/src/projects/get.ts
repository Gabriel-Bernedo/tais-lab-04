import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../shared/dynamo.js';
import { successResponse, errorResponse } from '../shared/response.js';
import type { Project } from '../shared/types.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const requestId = event.requestContext.requestId;
  const projectId = event.pathParameters?.projectId;

  if (!projectId) {
    return errorResponse(400, 'BAD_REQUEST', 'Identificador de proyecto requerido', requestId);
  }

  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLES.PROJECTS,
        Key: { projectId },
      })
    );

    const project = result.Item as Project | undefined;

    // CA-02.2: Proyecto inexistente o no publicado devuelve 404 al visitante sin revelar contenido
    if (!project || project.status !== 'PUBLICADO') {
      return errorResponse(404, 'NOT_FOUND', 'Proyecto no encontrado', requestId);
    }

    return successResponse(project);
  } catch (err: any) {
    return errorResponse(500, 'INTERNAL_ERROR', 'Error al obtener detalle del proyecto', requestId);
  }
}

