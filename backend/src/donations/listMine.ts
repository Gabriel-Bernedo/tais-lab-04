import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../shared/dynamo.js';
import { successResponse, errorResponse } from '../shared/response.js';
import { getCallerContext, assertHasRole, AuthzError } from '../authz/index.js';
import type { Donation } from '../shared/types.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const requestId = event.requestContext.requestId;

  try {
    const caller = getCallerContext(event);
    assertHasRole(caller, 'DONANTE'); // CA-07.1

    // CA-07.1: Consulta restringida exclusivamente al sub autenticado mediante GSI
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLES.DONATIONS,
        IndexName: 'DonorSubCreatedAtIndex',
        KeyConditionExpression: 'donorSub = :sub',
        ExpressionAttributeValues: {
          ':sub': caller.sub,
        },
        ScanIndexForward: false, // Más recientes primero
      })
    );

    const donations = (result.Items || []) as Donation[];
    return successResponse(donations);
  } catch (err: any) {
    if (err instanceof AuthzError) {
      return errorResponse(err.statusCode, err.code, err.message, requestId);
    }
    return errorResponse(500, 'INTERNAL_ERROR', 'Error al consultar historial de donaciones', requestId);
  }
}

