import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export const TABLES = {
  PROJECTS: process.env.PROJECTS_TABLE || 'Projects',
  DONATIONS: process.env.DONATIONS_TABLE || 'Donations',
  IDEMPOTENCY: process.env.IDEMPOTENCY_TABLE || 'Idempotency',
  AUDIT: process.env.AUDIT_TABLE || 'AuditEvents',
};

