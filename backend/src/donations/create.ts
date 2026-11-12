import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { GetCommand, TransactWriteCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { createHash, randomUUID } from 'crypto';
import { docClient, TABLES } from '../shared/dynamo.js';
import { successResponse, errorResponse } from '../shared/response.js';
import { getCallerContext, assertHasRole, AuthzError } from '../authz/index.js';
import { CreateDonationSchema, Donation, Project, IdempotencyRecord } from '../shared/types.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const requestId = event.requestContext.requestId;

  try {
    const caller = getCallerContext(event);
    assertHasRole(caller, 'DONANTE'); // CA-04.1 / CA-05.1

    // Cabecera Idempotency-Key obligatoria (UUID)
    const idempotencyKey = event.headers?.['idempotency-key'] || event.headers?.['Idempotency-Key'];
    if (!idempotencyKey) {
      return errorResponse(400, 'BAD_REQUEST', 'Cabecera Idempotency-Key obligatoria', requestId);
    }

    const bodyStr = event.body || '{}';
    const bodyJson = JSON.parse(bodyStr);
    const validated = CreateDonationSchema.parse(bodyJson);

    // Hash SHA-256 normalizado del body para verificar repetición con carga distinta (CA-05.4)
    const normalizedPayload = JSON.stringify({
      projectId: validated.projectId,
      amountCents: validated.amountCents,
    });
    const payloadHash = createHash('sha256').update(normalizedPayload).digest('hex');

    const idempotencyPk = `${caller.sub}#createDonation#${idempotencyKey}`;

    // 1. Verificar si la clave de idempotencia ya existe
    const existingIdemp = await docClient.send(
      new GetCommand({
        TableName: TABLES.IDEMPOTENCY,
        Key: { pk: idempotencyPk },
      })
    );

    if (existingIdemp.Item) {
      const rec = existingIdemp.Item as IdempotencyRecord;
      if (rec.payloadHash === payloadHash) {
        // Misma clave y misma carga: devolver resultado almacenado de forma idempotente
        return {
          statusCode: rec.responseStatus,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: rec.responseBody,
        };
      } else {
        // Misma clave con carga distinta: HTTP 409
        return errorResponse(409, 'CONFLICT', 'Reutilización de Idempotency-Key con diferente carga', requestId);
      }
    }

    // 2. Verificar que el proyecto exista y esté PUBLICADO
    const projectRes = await docClient.send(
      new GetCommand({
        TableName: TABLES.PROJECTS,
        Key: { projectId: validated.projectId },
      })
    );

    const project = projectRes.Item as Project | undefined;
    if (!project) {
      return errorResponse(404, 'NOT_FOUND', 'El proyecto especificado no existe', requestId);
    }
    if (project.status !== 'PUBLICADO') {
      return errorResponse(409, 'CONFLICT', 'No se aceptan donaciones para proyectos no publicados', requestId);
    }

    // 3. Crear registro de donación y reserva de idempotencia en un TransactWriteItems atómico
    const now = new Date().toISOString();
    const donationId = `don-${randomUUID()}`;
    const expiresAt = Math.floor(Date.now() / 1000) + 86400; // TTL 24 horas

    const newDonation: Donation = {
      donationId,
      projectId: validated.projectId,
      donorSub: caller.sub, // CA-05.3: obtenido del token verificado
      amountCents: validated.amountCents,
      currency: 'PEN',
      status: 'PENDIENTE_SIMULACION',
      createdAt: now,
      updatedAt: now,
    };

    const responseBodyStr = JSON.stringify(newDonation);

    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: TABLES.IDEMPOTENCY,
              Item: {
                pk: idempotencyPk,
                payloadHash,
                donationId,
                responseStatus: 201,
                responseBody: responseBodyStr,
                expiresAt,
              },
              ConditionExpression: 'attribute_not_exists(pk)',
            },
          },
          {
            Put: {
              TableName: TABLES.DONATIONS,
              Item: newDonation,
              ConditionExpression: 'attribute_not_exists(donationId)',
            },
          },
        ],
      })
    );

    // Registro de auditoría CA-10.2
    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLES.AUDIT,
          Item: {
            eventType: 'DONATION_INTENT',
            eventSk: `${now}#${randomUUID()}`,
            timestamp: now,
            requestId,
            actorRef: caller.sub,
            action: 'CREATE_DONATION_INTENT',
            resourceRef: donationId,
            outcome: 'SUCCESS',
            details: {
              projectId: validated.projectId,
              amountCents: validated.amountCents,
            },
          },
        })
      );
    } catch (auditErr) {
      console.warn('Advertencia: no se pudo escribir evento de auditoría', auditErr);
    }

    return successResponse(newDonation, 201);
  } catch (err: any) {
    if (err instanceof AuthzError) {
      return errorResponse(err.statusCode, err.code, err.message, requestId);
    }
    if (err.name === 'ZodError') {
      return errorResponse(400, 'BAD_REQUEST', 'Importe o datos de donación inválidos: ' + err.message, requestId);
    }
    if (err.name === 'TransactionCanceledException') {
      return errorResponse(409, 'CONFLICT', 'Conflicto de concurrencia en idempotencia o donación', requestId);
    }
    return errorResponse(500, 'INTERNAL_ERROR', 'Error al registrar donación', requestId);
  }
}

