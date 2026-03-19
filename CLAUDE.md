# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

### Development
- `npm run dev` - Start dev server with Turbopack on port 3000
- `npm run dev:daemon` - Start dev server in background (logs to logs.txt)
- `npm run build` - Build for production
- `npm run start` - Run production server
- `npm run setup` - Initial setup (npm install + prisma generate + migrate)

### Testing & Linting
- `npm run test` - Run Vitest tests in jsdom environment
- `npm run test -- src/path/to/test.test.tsx` - Run specific test file
- `npm run lint` - Run ESLint

### Database
- `npm run db:reset` - Hard reset database (clears all data)
- `npx prisma studio` - Open Prisma Studio UI for database inspection
- `npx prisma migrate dev` - Create and apply new migration

### Environment
- `.env` should contain `ANTHROPIC_API_KEY` if using Claude AI
- The app runs without the API key but uses static code generation instead

## Architecture Overview

### Core Systems

**Virtual File System**: The app uses an in-memory `VirtualFileSystem` class (`src/lib/file-system.ts`) that manages component files without writing to disk. Files are serialized to JSON for persistence in the database.

**Context Providers**: Two main contexts manage application state:
1. **FileSystemContext** (`src/lib/contexts/file-system-context.tsx`) - Manages virtual file tree, selected files, and handles file operations (create/update/delete/rename)
2. **ChatContext** (`src/lib/contexts/chat-context.tsx`) - Wraps Vercel's `useChat` hook, manages messages, input, and integrates with `/api/chat` endpoint

**AI Integration**: The `/api/chat` route (`src/app/api/chat/route.ts`) handles:
- Message streaming via Vercel's `streamText`
- Tool definitions for file manipulation (str_replace_editor, file_manager)
- System prompt with generation instructions
- Project persistence (saves messages and file data as JSON strings)
- Anthropic prompt caching for ephemeral cache control

**Tool System**: Two tools allow the AI to manipulate files:
1. `str_replace_editor` - Create files, replace text, insert lines
2. `file_manager` - Rename and delete files

Tool implementations are in `src/lib/tools/` and are integrated via `FileSystemProvider.handleToolCall()`.

### Data Model

Prisma schema (`prisma/schema.prisma`):
- **User**: id, email, password (hashed with bcrypt), timestamps, projects relation
- **Project**: id, name, userId (optional for anonymous), messages (JSON string), data (JSON string of file tree), timestamps

Projects are created with optional userId. Anonymous projects have null userId but cannot be persisted.

## File Structure

```
src/
├── app/              # Next.js App Router pages and routes
│   ├── page.tsx      # Landing page
│   ├── [projectId]/page.tsx  # Project editor
│   ├── api/chat/route.ts     # AI chat streaming endpoint
│   └── layout.tsx    # Root layout
├── components/       # React components
│   ├── chat/        # Chat UI (messages, input, markdown rendering)
│   ├── editor/      # Code editor and file tree
│   ├── preview/     # Component preview frame
│   ├── auth/        # Auth forms and dialogs
│   ├── ui/          # Radix UI shadcn components
│   └── HeaderActions.tsx  # Top-level actions
├── lib/             # Core utilities
│   ├── contexts/    # Chat and FileSystem providers
│   ├── tools/       # str_replace_editor and file_manager tool builders
│   ├── file-system.ts         # VirtualFileSystem class
│   ├── auth.ts      # Session and auth utilities
│   ├── provider.ts  # Language model provider (Claude/mock)
│   ├── anon-work-tracker.ts   # Track anonymous user work in localStorage
│   ├── prompts/generation.tsx # System prompt for component generation
│   └── transform/jsx-transformer.ts # JSX parsing/transformation utilities
├── actions/         # Server actions for DB operations
├── hooks/          # React hooks (use-auth.ts)
└── middleware.ts   # Next.js middleware (likely for auth routing)
```

## Key Implementation Details

### Virtual File System Workflow
1. User sends chat message describing component
2. ChatContext sends to `/api/chat` with serialized fileSystem
3. AI generates code using str_replace_editor tool
4. FileSystemContext.handleToolCall() processes tool results
5. FileSystemProvider triggers refresh and UI updates
6. Changes are stored in memory and serialized for persistence

### Component Generation
- System prompt in `src/lib/prompts/generation.tsx` instructs Claude on component generation
- AI can only modify files through defined tools (no arbitrary code execution)
- Generated components are JSX/React using Tailwind CSS
- Preview renders in iframe via `PreviewFrame` component

### Authentication
- Session-based using JWT (jose library)
- Passwords hashed with bcrypt
- Middleware in `src/middleware.ts` likely protects routes
- Anonymous users can work but cannot save projects

### Persistence
- Only authenticated users can save projects
- Project data stored as JSON strings in database
- Messages array and file tree both serialized
- On next visit, project is deserialized back into VirtualFileSystem

## Testing

Tests use Vitest with jsdom environment. Test files are colocated with source via `__tests__` directories:
- `src/lib/contexts/__tests__/`
- `src/components/chat/__tests__/`
- `src/components/editor/__tests__/`
- `src/lib/__tests__/`

Example: `npm run test -- src/lib/contexts/__tests__/file-system-context.test.tsx`

## Dependencies Notes

- **@ai-sdk/anthropic & ai**: Vercel's AI SDK for streaming and tool calling
- **Prisma**: Database ORM with SQLite
- **@monaco-editor/react**: Code editor used in UI
- **@babel/standalone**: JSX parsing in browser for preview
- **react-markdown**: Rendering AI response formatting
- **Radix UI**: Headless component library (wrapped as shadcn/ui components)
- **Tailwind CSS v4**: Styling framework

## Development Tips

- The `node-compat.cjs` is required for NODE_OPTIONS in dev/build scripts (handles Node polyfills)
- Turbopack is used for faster rebuilds (see `npm run dev`)
- No environment variable required to start, but AI features need `ANTHROPIC_API_KEY`
- The app uses `server-only` to mark server-only code
- ESLint extends Next.js config
