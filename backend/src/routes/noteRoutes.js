import { Router } from 'express';
import {
  DeleteCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import crypto from 'node:crypto';
import { db, NOTES_TABLE } from '../db.js';
import { requireAuth } from '../auth.js';

/** Protected CRUD endpoints for notes owned by the authenticated user. */
const router = Router();
router.use(requireAuth);

// Every command includes the authenticated user ID in its key, preventing a
// caller from addressing another user's note by ID alone.

/** Returns the current user's notes, newest note keys first. */
router.get('/', async (req, res) => {
  const { Items = [] } = await db.send(new QueryCommand({
    TableName: NOTES_TABLE,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': req.user.id },
    ScanIndexForward: false,
  }));
  res.json(Items);
});

/** Creates a note with a sortable timestamp-plus-UUID key. */
router.post('/', async (req, res) => {
  const title = String(req.body.title || '').trim();
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const note = {
    userId: req.user.id,
    noteKey: `${new Date().toISOString()}_${crypto.randomUUID()}`,
    title,
    body: String(req.body.body || ''),
    created_at: new Date().toISOString(),
  };
  note.id = note.noteKey;
  await db.send(new PutCommand({ TableName: NOTES_TABLE, Item: note }));
  res.status(201).json(note);
});

/** Updates only the editable title and body of an existing owned note. */
router.put('/:id', async (req, res) => {
  let result;
  try {
    result = await db.send(new UpdateCommand({
      TableName: NOTES_TABLE,
      Key: { userId: req.user.id, noteKey: req.params.id },
      UpdateExpression: 'SET title = :title, body = :body',
      ExpressionAttributeValues: {
        ':title': String(req.body.title || '').trim(),
        ':body': String(req.body.body || ''),
      },
      ConditionExpression: 'attribute_exists(noteKey)',
      ReturnValues: 'ALL_NEW',
    }));
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') result = null;
    else throw error;
  }
  if (!result) return res.status(404).json({ error: 'Note not found' });
  res.json(result.Attributes);
});

/** Deletes an existing owned note and returns an empty 204 response. */
router.delete('/:id', async (req, res) => {
  let result;
  try {
    result = await db.send(new DeleteCommand({
      TableName: NOTES_TABLE,
      Key: { userId: req.user.id, noteKey: req.params.id },
      ConditionExpression: 'attribute_exists(noteKey)',
    }));
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') result = null;
    else throw error;
  }
  if (!result) return res.status(404).json({ error: 'Note not found' });
  res.status(204).end();
});

export default router;
