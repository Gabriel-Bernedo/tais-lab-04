import type { Project, Donation, CreateDonationInput, CreateProjectInput } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Mock data en memoria para desarrollo local
const mockProjects: Project[] = [
  {
    projectId: 'proj-001',
    title: 'Comedores Comunitarios de Cayma',
    description: 'Abastecimiento de alimentos de primera necesidad y menaje seguro para 3 comedores que atienden a 250 familias.',
    goalAmountCents: 500000, // S/ 5,000.00
    confirmedAmountCents: 215000, // S/ 2,150.00
    currency: 'PEN',
    status: 'PUBLICADO',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    projectId: 'proj-002',
    title: 'Kits Escolares para Alto Selva Alegre',
    description: 'Útiles escolares y mochilas ergonómicas para niños de primaria en zonas de vulnerabilidad educativa.',
    goalAmountCents: 300000, // S/ 3,000.00
    confirmedAmountCents: 120000, // S/ 1,200.00
    currency: 'PEN',
    status: 'PUBLICADO',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    projectId: 'proj-003',
    title: 'Posta Médica Itinerante Cerro Colorado',
    description: 'Campañas de despistaje preventivo y botiquines comunales con personal voluntario de salud.',
    goalAmountCents: 800000, // S/ 8,000.00
    confirmedAmountCents: 45000, // S/ 450.00
    currency: 'PEN',
    status: 'BORRADOR', // Solo visible para GESTOR
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const mockDonations: Donation[] = [];

export const apiService = {
  // Proyectos públicos
  async getProjects(): Promise<Project[]> {
    if (!API_BASE_URL) {
      return mockProjects.filter((p) => p.status === 'PUBLICADO');
    }
    const res = await fetch(`${API_BASE_URL}/v1/projects`);
    if (!res.ok) throw new Error('Error al obtener proyectos');
    return res.json();
  },

  async getAllProjectsGestor(token?: string): Promise<Project[]> {
    if (!API_BASE_URL) {
      return mockProjects;
    }
    const res = await fetch(`${API_BASE_URL}/v1/projects/all`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Error al obtener todos los proyectos');
    return res.json();
  },

  async getProjectById(projectId: string): Promise<Project | null> {
    if (!API_BASE_URL) {
      const found = mockProjects.find((p) => p.projectId === projectId);
      return found ?? null;
    }
    const res = await fetch(`${API_BASE_URL}/v1/projects/${projectId}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Error al obtener el proyecto');
    return res.json();
  },

  // Donaciones (Donante autenticado)
  async createDonation(input: CreateDonationInput, token: string): Promise<Donation> {
    if (!API_BASE_URL) {
      // Mock local
      const project = mockProjects.find((p) => p.projectId === input.projectId);
      if (!project) throw new Error('Proyecto no encontrado');

      const newDonation: Donation = {
        donationId: `don-${Date.now()}`,
        projectId: input.projectId,
        projectTitle: project.title,
        donorSub: 'usr-donor-123',
        amountCents: input.amountCents,
        currency: 'PEN',
        status: 'PENDIENTE_SIMULACION',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockDonations.unshift(newDonation);
      return newDonation;
    }

    const res = await fetch(`${API_BASE_URL}/v1/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Idempotency-Key': input.idempotencyKey, // Requisito CA-05.1
      },
      body: JSON.stringify({
        projectId: input.projectId,
        amountCents: input.amountCents,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al registrar donación' }));
      throw new Error(err.message || 'Error en la solicitud');
    }
    return res.json();
  },

  // Simulación de confirmación (Stage académico - CA-06.1)
  async simulateDonation(donationId: string, action: 'CONFIRMAR' | 'RECHAZAR', token: string): Promise<Donation> {
    if (!API_BASE_URL) {
      const donation = mockDonations.find((d) => d.donationId === donationId);
      if (!donation) throw new Error('Donación no encontrada');
      if (donation.status !== 'PENDIENTE_SIMULACION') {
        throw new Error('Transición inválida: la donación ya fue resuelta');
      }

      donation.status = action === 'CONFIRMAR' ? 'CONFIRMADA_SIMULADA' : 'RECHAZADA_SIMULADA';
      donation.updatedAt = new Date().toISOString();

      if (action === 'CONFIRMAR') {
        const project = mockProjects.find((p) => p.projectId === donation.projectId);
        if (project) {
          project.confirmedAmountCents += donation.amountCents;
        }
      }
      return donation;
    }

    const res = await fetch(`${API_BASE_URL}/v1/donations/${donationId}/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error en la simulación' }));
      throw new Error(err.message || 'Error en la simulación');
    }
    return res.json();
  },

  // Historial de donaciones propias (CA-07.1)
  async getMyDonations(token: string): Promise<Donation[]> {
    if (!API_BASE_URL) {
      return [...mockDonations];
    }
    const res = await fetch(`${API_BASE_URL}/v1/donations/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error('Error al obtener historial');
    return res.json();
  },

  // Gestión de proyectos (Gestor - HU-08)
  async createProject(input: CreateProjectInput, token: string): Promise<Project> {
    if (!API_BASE_URL) {
      const newProject: Project = {
        projectId: `proj-${Date.now()}`,
        title: input.title,
        description: input.description,
        goalAmountCents: input.goalAmountCents,
        confirmedAmountCents: 0,
        currency: 'PEN',
        status: 'BORRADOR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockProjects.push(newProject);
      return newProject;
    }

    const res = await fetch(`${API_BASE_URL}/v1/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });

    if (!res.ok) throw new Error('Error al crear el proyecto');
    return res.json();
  },

  async publishProject(projectId: string, token: string): Promise<Project> {
    if (!API_BASE_URL) {
      const project = mockProjects.find((p) => p.projectId === projectId);
      if (!project) throw new Error('Proyecto no encontrado');
      project.status = 'PUBLICADO';
      project.updatedAt = new Date().toISOString();
      return project;
    }

    const res = await fetch(`${API_BASE_URL}/v1/projects/${projectId}/publish`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error('Error al publicar el proyecto');
    return res.json();
  },
};

