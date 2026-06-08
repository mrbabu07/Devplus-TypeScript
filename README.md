# DevPulse - Internal Tech Issue Tracker

DevPulse is a TypeScript, Express, and PostgreSQL API for software teams to report bugs, request features, and manage issue workflow permissions.

## Live URL

Local development URL: `http://localhost:5000`

Vercel URL: Add your deployed Vercel URL here after deployment.

## Features

- User registration and login with hashed passwords
- JWT authentication using the `Authorization: <JWT_TOKEN>` header
- Contributor and maintainer role permissions
- Issue creation, listing, filtering, sorting, single issue details, update, and delete
- Maintainers can update any issue and delete issues
- Contributors can update only their own open issues
- PostgreSQL schema initialization on server startup
- Raw SQL with native `pg` driver only

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from `.env.example`:

```env
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
```

3. Run the development server:

```bash
npm run dev
```

4. Build the project:

```bash
npm run build
```

## Vercel Deployment

This project is ready for Vercel Express deployment. Vercel can detect the default exported Express app from `src/app.ts`. The local `src/server.ts` file is used only for `npm run dev` and `npm start`.

1. Push the repository to GitHub.

2. Import the repository in Vercel.

3. Set the Node.js version to `24.x` if Vercel does not auto-detect it from `package.json`.

4. Add these Environment Variables in Vercel Project Settings:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
```

Do not add `PORT` in Vercel. Vercel manages the runtime port automatically.

5. Deploy from the Vercel dashboard, or use the CLI:

```bash
npx vercel
```

For production deployment:

```bash
npx vercel --prod
```

## Tech Stack

- Node.js 24+
- TypeScript
- Express.js
- PostgreSQL
- Native `pg` driver
- Raw SQL
- bcrypt
- jsonwebtoken
- http-status-codes

## API Endpoints

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/issues`
- `GET /api/issues?sort=newest&type=bug&status=open`
- `GET /api/issues/:id`
- `PATCH /api/issues/:id`
- `DELETE /api/issues/:id`

## Database Schema Summary

### users

| Field | Type | Notes |
| --- | --- | --- |
| id | SERIAL | Primary key |
| name | VARCHAR(200) | Required |
| email | VARCHAR(200) | Required, unique |
| password | TEXT | Required, bcrypt hashed, never returned |
| role | VARCHAR(20) | `contributor` or `maintainer`, defaults to `contributor` |
| created_at | TIMESTAMP | Defaults to current timestamp |
| updated_at | TIMESTAMP | Auto-updated by trigger |

### issues

| Field | Type | Notes |
| --- | --- | --- |
| id | SERIAL | Primary key |
| title | VARCHAR(150) | Required |
| description | TEXT | Required, minimum 20 characters |
| type | VARCHAR(20) | `bug` or `feature_request` |
| status | VARCHAR(20) | `open`, `in_progress`, or `resolved`, defaults to `open` |
| reporter_id | INTEGER | Reporter user id, validated in application logic |
| created_at | TIMESTAMP | Defaults to current timestamp |
| updated_at | TIMESTAMP | Auto-updated by trigger |

## Project Structure

```text
src/
  config/
  middleware/
  modules/
  utils/
```
