import { z } from 'zod';

export type ProjectStatus = 'BORRADOR' | 'PUBLICADO';

export interface Project {
  projectId: string;
  title: string;
  description: string;
  goalAmountCents: number;
  confirmedAmountCents: number;
  currency: 'PEN';
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export type DonationStatus = 'PENDIENTE_SIMULACION' | 'CONFIRMADA_SIMULADA' | 'RECHAZADA_SIMULADA';

export interface Donation {
  donationId: string;
  projectId: string;
  donorSub: string;
  amountCents: number;
  currency: 'PEN';
  status: DonationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IdempotencyRecord {
  pk: string;
  payloadHash: string;
  donationId: string;
  responseStatus: number;
  responseBody: string;
  expiresAt: number;
}

export interface AuditEvent {
  eventType: string;
  eventSk: string;
  timestamp: string;
  requestId: string;
  actorRef: string;
  action: string;
  resourceRef: string;
  outcome: 'SUCCESS' | 'DENIED' | 'ERROR';
}

// Esquemas Zod de validación (CA-05.1, CA-08.1)
export const CreateProjectSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  goalAmountCents: z.number().int().positive().min(1000), // mínimo S/ 10.00
});

export const CreateDonationSchema = z.object({
  projectId: z.string().min(1),
  amountCents: z.number().int().min(100).max(100000), // Mínimo S/ 1.00, Máximo S/ 1,000.00
});

export const SimulateDonationSchema = z.object({
  action: z.enum(['CONFIRMAR', 'RECHAZAR']),
});

