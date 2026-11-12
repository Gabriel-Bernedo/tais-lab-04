import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { GetCommand, TransactWriteCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { docClient, TABLES } from '../shared/dynamo.js';
import { successResponse, errorResponse } from '../shared/response.js';
import { getCallerContext, assertHasRole, AuthzError } from '../authz/index.js';
import { SimulateDonationSchema, Donation } from '../shared/types.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const requestId = event.requestContext.requestId;
  const donationId = event.pathParameters?.donationId;

  if (!donationId) {
    return errorResponse(400, 'BAD_REQUEST', 'Identificador de donación requerido', requestId);
  }

  try {
    const caller = getCallerContext(event);
    assertHasRole(caller, 'DONANTE'); // CA-06.1

    const body = JSON.parse(event.body || '{}');
    const validated = SimulateDonationSchema.parse(body);

    // 1. Obtener la donación y verificar ownership (CA-07.2 BOLA)
    const getRes = await docClient.send(
      new GetCommand({
        TableName: TABLES.DONATIONS,
        Key: { donationId },
      })
    );

    const donation = getRes.Item as Donation | undefined;
    if (!donation) {
      return errorResponse(404, 'NOT_FOUND', 'Donación no encontrada', requestId);
    }

    if (donation.donorSub !== caller.sub) {
      // CA-07.2: donación ajena devuelve 403 o 404
      return errorResponse(403, 'FORBIDDEN', 'Acceso denegado: solo el propietario puede simular la donación', requestId);
    }

    if (donation.status !== 'PENDIENTE_SIMULACION') {
      return errorResponse(409, 'CONFLICT', 'La donación ya fue resuelta previamente', requestId);
    }

    const now = new Date().toISOString();
    const newStatus = validated.action === 'CONFIRMAR' ? 'CONFIRMADA_SIMULADA' : 'RECHAZADA_SIMULADA';

    // 2. Transacción atómica condicionada (CA-06.2, CA-NF04.1, CA-NF04.2)
    const transactItems: any[] = [
      {
        Update: {
          TableName: TABLES.DONATIONS,
          Key: { donationId },
          UpdateExpression: 'SET #status = :newStatus, #updatedAt = :now',
          ConditionExpression: 'attribute_exists(donationId) AND #status = :pending AND donorSub = :sub',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#updatedAt': 'updatedAt',
          },
          ExpressionAttributeValues: {
            ':newStatus': newStatus,
            ':pending': 'PENDIENTE_SIMULACION',
            ':sub': caller.sub,
            ':now': now,
          },
        },
      },
    ];

    // Solo si se confirma se incrementa el acumulado del proyecto de forma atómica
    if (validated.action === 'CONFIRMAR') {
      transactItems.push({
        Update: {
          TableName: TABLES.PROJECTS,
          Key: { projectId: donation.projectId },
          UpdateExpression: 'ADD confirmedAmountCents :inc SET #updatedAt = :now',
          ConditionExpression: 'attribute_exists(projectId)',
          ExpressionAttributeNames: {
            '#updatedAt': 'updatedAt',
          },
          ExpressionAttributeValues: {
            ':inc': donation.amountCents,
            ':now': now,
          },
        },
      });
    }

    await docClient.send(new TransactWriteCommand({ TransactItems: transactItems }));

    donation.status = newStatus;
    donation.updatedAt = now;

    // Registro de auditoría CA-10.2
    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLES.AUDIT,
          Item: {
            eventType: validated.action === 'CONFIRMAR' ? 'DONATION_CONFIRMED' : 'DONATION_REJECTED',
            eventSk: `${now}#${randomUUID()}`,
            timestamp: now,
            requestId,
            actorRef: caller.sub,
            action: `SIMULATE_${validated.action}`,
            resourceRef: donationId,
            outcome: 'SUCCESS',
            details: {
              projectId: donation.projectId,
              amountCents: donation.amountCents,
              finalStatus: newStatus,
            },
          },
        })
      );
    } catch (auditErr) {
      console.warn('Advertencia: no se pudo escribir evento de auditoría', auditErr);
    }

    return successResponse(donation);
  } catch (err: any) {
    if (err instanceof AuthzError) {
      return errorResponse(err.statusCode, err.code, err.message, requestId);
    }
    if (err.name === 'ZodError') {
      return errorResponse(400, 'BAD_REQUEST', 'Acción de simulación inválida: ' + err.message, requestId);
    }
    if (err.name === 'TransactionCanceledException') {
      return errorResponse(409, 'CONFLICT', 'Transición inválida o carrera concurrente en la donación', requestId);
    }
    return errorResponse(500, 'INTERNAL_ERROR', 'Error al simular confirmación de donación', requestId);
  }
}

