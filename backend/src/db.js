import 'dotenv/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/** DynamoDB table names can be overridden for separate environments. */
export const USERS_TABLE = process.env.USERS_TABLE || 'cloudtrek-users';
export const NOTES_TABLE = process.env.NOTES_TABLE || 'cloudtrek-notes';

/**
 * The low-level client supports both AWS DynamoDB and DynamoDB Local.
 * `DYNAMODB_ENDPOINT` is omitted unless explicitly configured so normal AWS
 * credential and region resolution continues to work in deployed environments.
 */
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.DYNAMODB_ENDPOINT ? { endpoint: process.env.DYNAMODB_ENDPOINT } : {}),
});

/**
 * Document client used by route handlers so application objects can be sent
 * directly instead of manually marshalling DynamoDB attribute values.
 */
export const db = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});
