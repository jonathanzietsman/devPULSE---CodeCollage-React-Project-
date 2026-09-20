# DevPulse

A developer wellness and project tracker. Log coding sessions, track hours per project, and monitor mood and burnout over time.

## Live Demo

[devpulse.vercel.app](https://your-vercel-url.vercel.app)

## Features

- Email/password authentication (Firebase Auth)
- Dark mode with persistent preference
- Stat cards: total hours, project count, avg mood (7d), avg burnout (7d)
- Create and delete projects (scoped per user)
- Log sessions with hours, mood (1–5), burnout (1–5), and notes
- Auto-aggregation of total hours per project
- Search, filter, and sort the health log stream
- Quick-add hour buttons (1h, 2h, 4h, 8h)
- Two-step delete confirmation
- Toast notifications for actions
- Relative timestamps ("2h ago")
- Redux Toolkit for state management
- Firestore security rules for per-user isolation

## Tech Stack

- React 19
- Redux Toolkit
- Firebase (Auth + Firestore)
- Vercel (hosting)

## Project Structure

```
src/
  config/firebase-config.js       Firebase init
  features/authSlice.js           Auth state
  features/projectsSlice.js       Projects state
  features/healthSlice.js         Health log state
  hooks/useProjects.js            Firestore CRUD for projects
  hooks/useHealth.js              Firestore CRUD for health logs
  hooks/useTheme.js               Light/dark theme toggle
  pages/login/                    Auth UI
  pages/dashboard/                Main dashboard
```

## Running Locally

1. Install Node.js 20+
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill in your Firebase config
4. In Firebase Console:
   - Enable Email/Password in **Authentication**
   - Create a Firestore database
   - Add your domain to **Authentication → Authorized domains**
5. Create Firestore composite indexes:
   - `projects`: `userId ASC, createdAt DESC`
   - `health_logs`: `userId ASC, createdAt DESC`
6. `npm start`

## Firestore Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /projects/{projectId} {
      allow read: if request.auth != null
                  && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
                    && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null
                            && request.auth.uid == resource.data.userId;
    }

    match /health_logs/{logId} {
      allow read: if request.auth != null
                  && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
                    && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null
                            && request.auth.uid == resource.data.userId;
    }
  }
}
```

## Deploying to Vercel

1. Push the repo to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add the `REACT_APP_FIREBASE_*` environment variables in Vercel
4. Add your Vercel domain to Firebase Auth's authorized domains
5. Deploy

## Known Limitations

- Deleting a project does not cascade-delete its health logs
- No password reset flow yet
- No chart / trend visualization yet