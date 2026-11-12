import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../shared/dynamo.js';
import { successResponse, errorResponse } from '../shared/response.js';
import { getCallerContext, assertHasRole, AuthzError } from '../authz/index.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const requestId = event.requestContext.requestId;

  try {
    const caller = getCallerContext(event);
    assertHasRole(caller, 'AUDITOR'); // CA-10.1: Solo AUDITOR puede consultar la bitácora

    const eventType = event.queryStringParameters?.eventType;

    let items: any[] = [];

    if (eventType && eventType !== 'ALL') {
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLES.AUDIT,
          KeyConditionExpression: 'eventType = :et',
          ExpressionAttributeValues: {
            ':et': eventType,
          },
          ScanIndexForward: false,
          Limit: 100,
        })
      );
      items = result.Items || [];
    } else {
      const result = await docClient.send(
        new ScanCommand({
          TableName: TABLES.AUDIT,
          Limit: 100,
        })
      );
      items = result.Items || [];
      items.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    }

    return successResponse(items, 200);
  } catch (err: any) {
    if (err instanceof AuthzError) {
      return errorResponse(err.statusCode, err.code, err.message, requestId);
    }
    return errorResponse(500, 'INTERNAL_ERROR', 'Error al consultar bitácora de auditoría', requestId);
  }
}

