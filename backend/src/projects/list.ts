import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../shared/dynamo.js';
import { successResponse, errorResponse } from '../shared/response.js';
import type { Project } from '../shared/types.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const requestId = event.requestContext.requestId;

  try {
    // CA-01.1 & CA-01.2: Solo devolver proyectos PUBLICADO
    const command = new QueryCommand({
      TableName: TABLES.PROJECTS,
      IndexName: 'StatusCreatedAtIndex',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'PUBLICADO',
      },
    });

    const result = await docClient.send(command);
    const projects = (result.Items || []) as Project[];

    return successResponse(projects);
  } catch (err: any) {
    return errorResponse(500, 'INTERNAL_ERROR', 'Error al consultar catálogo de proyectos', requestId);
  }
}

