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
  projectTitle?: string;
  donorSub: string;
  amountCents: number;
  currency: 'PEN';
  status: DonationStatus;
  createdAt: string;
  updatedAt: string;
}

export type Role = 'DONANTE' | 'GESTOR' | 'AUDITOR';

export interface AuthUser {
  sub: string;
  email: string;
  roles: Role[];
  accessToken: string;
}

export interface CreateDonationInput {
  projectId: string;
  amountCents: number;
  idempotencyKey: string;
}

export interface CreateProjectInput {
  title: string;
  description: string;
  goalAmountCents: number;
}

