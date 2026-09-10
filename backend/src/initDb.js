import 'dotenv/config';
import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import { NOTES_TABLE, USERS_TABLE } from './db.js';

/**
 * Uses the same DynamoDB connection settings as the application and creates
 * the two required tables only when they do not already exist.
 */
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.DYNAMODB_ENDPOINT ? { endpoint: process.env.DYNAMODB_ENDPOINT } : {}),
});

/**
 * Idempotently creates a DynamoDB table.
 * Existing tables are treated as success so this script can safely run during
 * local setup or deployment initialization more than once.
 *
 * @param {object} params DynamoDB CreateTable parameters.
 * @returns {Promise<void>} Resolves after the table is confirmed or created.
 */
async function createTableIfMissing(params) {
  try {
    await client.send(new DescribeTableCommand({ TableName: params.TableName }));
    console.log(`Table already exists: ${params.TableName}`);
  } catch (error) {
    if (error.name !== 'ResourceNotFoundException') throw error;
    await client.send(new CreateTableCommand(params));
    console.log(`Created table: ${params.TableName}`);
  }
}

await createTableIfMissing({
  TableName: USERS_TABLE,
  KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
  AttributeDefinitions: [{ AttributeName: 'email', AttributeType: 'S' }],
  BillingMode: 'PAY_PER_REQUEST',
});

await createTableIfMissing({
  TableName: NOTES_TABLE,
  KeySchema: [
    { AttributeName: 'userId', KeyType: 'HASH' },
    { AttributeName: 'noteKey', KeyType: 'RANGE' },
  ],
  AttributeDefinitions: [
    { AttributeName: 'userId', AttributeType: 'S' },
    { AttributeName: 'noteKey', AttributeType: 'S' },
  ],
  BillingMode: 'PAY_PER_REQUEST',
});

console.log(`DynamoDB ready: ${USERS_TABLE}, ${NOTES_TABLE}`);
