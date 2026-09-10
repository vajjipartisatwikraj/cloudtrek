# CloudTrek Notes Saver

CloudTrek is a small full-stack notes application. The browser client is built
with React and Vite. The API is an Express service that authenticates users
with JWTs and stores users and notes in DynamoDB.

This document is the operational reference for the repository. Source files
also contain module and function documentation where implementation details are
important.

## Repository layout

```text
backend/
   src/index.js              Express app, middleware, health check, startup
   src/auth.js               JWT creation and authentication middleware
   src/db.js                 DynamoDB client and table-name configuration
   src/initDb.js             Idempotent table creation script
   src/routes/authRoutes.js  Signup and login endpoints
   src/routes/noteRoutes.js  Authenticated note CRUD endpoints
   Dockerfile                Production API image

frontend/
   src/main.jsx              Browser entry point
   src/App.jsx               Authenticated/logged-out view switch
   src/Auth.jsx              Login and signup form
   src/Notes.jsx             Note creation, editing, listing, and deletion
   src/api.js                JSON fetch wrapper and token storage helpers
   src/styles.css            Shared application styles
   index.html                Vite HTML shell
   vite.config.js            Vite configuration
   Dockerfile                Static build served by Nginx
```

## Request flow

1. Vite serves the React application on `http://localhost:5173`.
2. The client sends JSON requests to `VITE_API_URL` and stores the returned JWT
    in browser `localStorage` under `token`.
3. The Express API accepts the JWT as `Authorization: Bearer <token>`.
4. JWT verification adds the user identity to `req.user`.
5. Note queries use `req.user.id` as the DynamoDB partition key, so each user
    can read and mutate only their own notes.

## Requirements

- Node.js 20 or later
- npm
- AWS DynamoDB access, or DynamoDB Local for development
- A strong JWT signing secret

## Local setup

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure the backend

Create `backend/.env`:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
JWT_SECRET=replace-with-a-long-random-secret
PORT=4000
CORS_ORIGIN=http://localhost:5173
USERS_TABLE=cloudtrek-users
NOTES_TABLE=cloudtrek-notes
```

The AWS SDK also supports its normal credential chain, including shared AWS
profiles, environment variables, and IAM roles. Do not commit real credentials
or a production JWT secret.

For DynamoDB Local, add this optional setting and use any non-empty local
credentials required by the local emulator:

```env
DYNAMODB_ENDPOINT=http://localhost:8000
```

`AWS_REGION`, `PORT`, `CORS_ORIGIN`, `USERS_TABLE`, and `NOTES_TABLE` have
working defaults in the source. `JWT_SECRET` is required and the API fails at
startup when it is missing.

### 3. Configure the frontend

The repository includes `frontend/.env` with the local API URL:

```env
VITE_API_URL=http://localhost:4000
```

The value must not end with `/` because the client appends `/api` when building
request URLs. Vite reads environment variables when it starts, so restart the
frontend after changing this file.

### 4. Create DynamoDB tables

Run this once after the backend environment is configured:

```bash
cd backend
npm run init-db
```

The command is idempotent. It checks for each table first and leaves existing
tables unchanged.

### 5. Start the services

In terminal one:

```bash
cd backend
npm run dev
```

In terminal two:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`, create an account, and add a note.

## Configuration reference

| Variable | Service | Default | Purpose |
| --- | --- | --- | --- |
| `AWS_REGION` | Backend | `us-east-1` | DynamoDB region |
| `AWS_ACCESS_KEY_ID` | Backend | AWS SDK default | AWS credential, if not using another credential source |
| `AWS_SECRET_ACCESS_KEY` | Backend | AWS SDK default | AWS credential, if not using another credential source |
| `DYNAMODB_ENDPOINT` | Backend | unset | Optional DynamoDB Local or compatible endpoint |
| `JWT_SECRET` | Backend | none | Required signing key for seven-day JWTs |
| `PORT` | Backend | `4000` | API listening port |
| `CORS_ORIGIN` | Backend | `http://localhost:5173` | Allowed browser origin |
| `USERS_TABLE` | Backend | `cloudtrek-users` | User table name |
| `NOTES_TABLE` | Backend | `cloudtrek-notes` | Notes table name |
| `VITE_API_URL` | Frontend | `http://localhost:4000` | API origin used by the browser |

## API reference

All endpoints return JSON except successful note deletion, which returns
`204 No Content`. Error responses use this shape:

```json
{ "error": "Human-readable message" }
```

### Health check

`GET /health`

Response:

```json
{ "ok": true }
```

### Sign up

`POST /api/auth/signup`

Request:

```json
{ "email": "person@example.com", "password": "at-least-six" }
```

Success: `201 Created`

```json
{
   "token": "jwt",
   "user": { "id": "uuid", "email": "person@example.com" }
}
```

Possible errors: `400` for invalid input and `409` when the email already
exists.

### Log in

`POST /api/auth/login`

Request and success response use the same shape as signup. Success is
`200 OK`; invalid credentials return `401 Unauthorized`.

### List notes

`GET /api/notes`

Requires `Authorization: Bearer <token>`.

Response:

```json
[
   {
      "id": "2026-01-01T12:00:00.000Z_uuid",
      "userId": "user-uuid",
      "noteKey": "2026-01-01T12:00:00.000Z_uuid",
      "title": "First note",
      "body": "Note text",
      "created_at": "2026-01-01T12:00:00.000Z"
   }
]
```

Notes are returned newest first according to their sort key.

### Create a note

`POST /api/notes`

Request:

```json
{ "title": "First note", "body": "Note text" }
```

Success: `201 Created`, returning the stored note. A non-empty title is
required.

### Update a note

`PUT /api/notes/:id`

Request:

```json
{ "title": "Updated title", "body": "Updated text" }
```

Success: `200 OK`, returning the updated note. An unknown note returns `404`.

### Delete a note

`DELETE /api/notes/:id`

Success: `204 No Content`. An unknown note returns `404`.

## DynamoDB schema

The setup script creates on-demand tables:

### Users table

- Partition key: `email` (`String`)
- Attributes: `email`, `id`, `password_hash`
- Passwords are stored as bcrypt hashes, never as plaintext.

### Notes table

- Partition key: `userId` (`String`)
- Sort key: `noteKey` (`String`)
- Attributes: `userId`, `noteKey`, `id`, `title`, `body`, `created_at`
- `noteKey` combines an ISO timestamp and UUID to provide uniqueness and
   chronological query ordering.

## npm scripts

Backend scripts:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the API with Node's watch mode |
| `npm start` | Run the API without watch mode |
| `npm run init-db` | Create missing DynamoDB tables |

Frontend scripts:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Produce the deployable `dist` bundle |
| `npm run preview` | Serve the built bundle locally |

## Docker

The backend image runs the Express service on port `4000`. The frontend image
builds the Vite bundle and serves it through Nginx on port `80`.

Build and run the images from their respective directories after providing the
backend environment through your deployment platform:

```bash
docker build -t cloudtrek-backend ./backend
docker build -t cloudtrek-frontend ./frontend
docker run --env-file backend/.env -p 4000:4000 cloudtrek-backend
docker run -p 5173:80 cloudtrek-frontend
```

For a containerized frontend, `VITE_API_URL` is baked into the static bundle
at build time. Set it before `docker build`, or build using the API's public
origin for the target environment.

## Security and production checklist

- Use a long, randomly generated `JWT_SECRET` and keep it outside source
   control.
- Use HTTPS in production so credentials and bearer tokens are encrypted in
   transit.
- Replace the development `localStorage` token approach with an `httpOnly`,
   `Secure`, `SameSite` cookie session for stronger XSS resistance.
- Restrict `CORS_ORIGIN` to the deployed frontend origin; do not use a wildcard
   when credentials or private data are involved.
- Use least-privilege IAM permissions limited to the configured DynamoDB
   tables.
- Add request rate limiting, stronger email validation, structured logging,
   automated tests, and monitoring before exposing the API publicly.
- Do not log passwords, JWTs, AWS credentials, or complete authorization
   headers.

## Documentation map

- Backend authentication behavior: `backend/src/auth.js`
- DynamoDB client and table names: `backend/src/db.js`
- Table creation behavior: `backend/src/initDb.js`
- API startup and middleware: `backend/src/index.js`
- Auth endpoint behavior: `backend/src/routes/authRoutes.js`
- Notes endpoint behavior: `backend/src/routes/noteRoutes.js`
- Browser/API session contract: `frontend/src/api.js`
- UI responsibilities: `frontend/src/App.jsx`, `frontend/src/Auth.jsx`, and
   `frontend/src/Notes.jsx`
