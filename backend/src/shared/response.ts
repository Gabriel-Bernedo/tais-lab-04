import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

export const defaultHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,Idempotency-Key',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
};

export function successResponse(data: unknown, statusCode = 200): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: defaultHeaders,
    body: JSON.stringify(data),
  };
}

export function errorResponse(
  statusCode: number,
  code: string,
  message: string,
  requestId: string
): APIGatewayProxyStructuredResultV2 {
  // RNF-HU-07: Logs JSON estructurados sanitizados
  console.error(
    JSON.stringify({
      level: 'ERROR',
      statusCode,
      code,
      message,
      requestId,
      timestamp: new Date().toISOString(),
    })
  );

  return {
    statusCode,
    headers: defaultHeaders,
    body: JSON.stringify({
      code,
      message,
      requestId,
    }),
  };
}

