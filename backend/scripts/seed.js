import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

const projects = [
  {
    projectId: 'proj-001',
    title: 'Comedores Comunitarios de Cayma',
    description: 'Abastecimiento de alimentos de primera necesidad y menaje seguro para 3 comedores que atienden a 250 familias en Arequipa.',
    goalAmountCents: 500000,
    confirmedAmountCents: 150000,
    currency: 'PEN',
    status: 'PUBLICADO',
    createdAt: '2026-11-10T12:00:00.000Z',
    updatedAt: '2026-11-10T12:00:00.000Z'
  },
  {
    projectId: 'proj-002',
    title: 'Kits Escolares para Alto Selva Alegre',
    description: 'Útiles escolares y mochilas ergonómicas para niños de primaria en zonas de vulnerabilidad educativa.',
    goalAmountCents: 300000,
    confirmedAmountCents: 80000,
    currency: 'PEN',
    status: 'PUBLICADO',
    createdAt: '2026-11-11T12:00:00.000Z',
    updatedAt: '2026-11-11T12:00:00.000Z'
  },
  {
    projectId: 'proj-003',
    title: 'Posta Médica Itinerante Cerro Colorado',
    description: 'Campañas de despistaje preventivo y botiquines comunales con personal voluntario de salud.',
    goalAmountCents: 800000,
    confirmedAmountCents: 0,
    currency: 'PEN',
    status: 'BORRADOR',
    createdAt: '2026-11-12T12:00:00.000Z',
    updatedAt: '2026-11-12T12:00:00.000Z'
  }
];

async function seed() {
  console.log('Insertando proyectos en DynamoDB...');
  for (const p of projects) {
    await docClient.send(new PutCommand({
      TableName: 'donations-projects-academic',
      Item: p
    }));
    console.log(`-> Insertado: ${p.projectId} (${p.title})`);
  }
  console.log('¡Siembra completada con éxito!');
}

seed().catch(console.error);

