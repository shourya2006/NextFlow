# NextFlow

NextFlow is a powerful, visual node-based workflow automation builder. It allows users to create, connect, and execute complex workflows involving media processing and AI generation through an intuitive drag-and-drop interface.

## Demonstration

Demonstration Video - https://drive.google.com/file/d/1NJpum5YaPw8BwkhDHlXQ89ZJgIp2FS-i/view?usp=sharing


## Features

- **Visual Workflow Builder**: Interactive drag-and-drop canvas powered by [React Flow](https://reactflow.dev/).
- **AI Integration**: Built-in support for LLM nodes using Google Generative AI (Gemini).
- **Media Processing**: Extract frames from videos and crop images natively using background workers.
- **Background Tasks**: Reliable, asynchronous execution of workflow nodes using [Trigger.dev v3](https://trigger.dev/).
- **Authentication**: Secure user authentication and session management via [Clerk](https://clerk.com/).
- **Database**: PostgreSQL integration with [Neon](https://neon.tech/) and Prisma ORM.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Visual Nodes**: React Flow
- **Background Jobs**: Trigger.dev v3
- **Database**: PostgreSQL (Neon) & Prisma ORM
- **Auth**: Clerk
- **AI**: Google Generative AI (Gemini)
- **Media Processing**: FFmpeg (fluent-ffmpeg), Sharp
- **Styling**: Tailwind CSS

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd nextflow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy the `.env.example` file to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

You will need to set up and configure keys for:
- **Clerk**: Publishable and Secret keys for authentication.
- **Neon / PostgreSQL**: Database connection string for Prisma.
- **Trigger.dev**: Secret key for background workers.
- **Gemini**: API key for the LLM node.

### 4. Setup Database

Run the Prisma migrations to initialize your database schema:

```bash
npx prisma generate
npx prisma db push
```

### 5. Run the Application locally

You will need two terminal windows running simultaneously to handle the Next.js frontend and the Trigger.dev background workers.

**Terminal 1: Next.js Dev Server**
```bash
npm run dev
```

**Terminal 2: Trigger.dev Background Worker**
```bash
npx trigger.dev@latest dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

## Deployment

To deploy NextFlow to production:

1. **Frontend**: Deploy your Next.js application to Vercel, Netlify, or your preferred hosting provider. Be sure to add all environment variables.
2. **Background Tasks**: Deploy your Trigger.dev tasks to Trigger.dev Cloud by running:
   ```bash
   npx trigger.dev@latest deploy
   ```
   *Note: Ensure you add your environment variables (like `GEMINI_API_KEY` and `DATABASE_URL`) directly to the Trigger.dev Dashboard for your Prod environment.*
