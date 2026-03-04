# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A multi-view todo list application built with Next.js 16, Prisma ORM, and PostgreSQL. Supports day/week/month/quarter/year views with recurring tasks, subtasks, and holiday integration.

## Common Commands

```bash
# Development
bun run dev              # Start dev server on port 3000

# Database (Prisma)
bun run db:generate      # Generate Prisma Client (required after schema changes)
bun run db:push          # Push schema changes to database (dev)
bun run db:migrate       # Create and apply migrations
bun run db:reset         # Reset database (deletes all data)

# Build & Production
bun run build            # Build for production (includes prisma generate + migrate deploy)
bun run start            # Start production server
bun run lint             # Run ESLint
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **State**: TanStack Query (server state) + Zustand (client state)
- **UI**: Tailwind CSS 4 + shadcn/ui + Framer Motion

### Key Directories

- `src/app/api/` - API routes following Next.js App Router conventions
- `src/components/views/` - Main view components (DayView, CalendarView, WeeklyKanban, etc.)
- `src/hooks/use-view-store.ts` - Zustand store for view/navigation state
- `src/services/recurrence-service.ts` - Recurring task generation logic
- `prisma/schema.prisma` - Database models

### Database Models

- **Todo** - Main task table with dates stored as ISO strings (YYYY-MM-DD)
- **Category** - Task categories with emoji and color
- **Level** - Priority levels (高/中/低, values 3/2/1)
- **RecurrenceRule** - Rules for recurring tasks (DAILY/WEEKLY/MONTHLY/YEARLY/CUSTOM)
- **Holiday** - Cached holiday data from external API

### Task Type Detection

Task types are computed dynamically, not stored:
- **Basic task**: `startDate === dueDate` and no subtasks
- **Multi-day task**: `startDate !== dueDate`
- **Multi-step task**: has `subTasks` content
- **Recurring task**: `isCycleTask === true`

### State Management

**Server State** (TanStack Query):
- `use-todos.ts`, `use-categories.ts`, `use-levels.ts` - Data fetching hooks

**Client State** (Zustand):
- `use-view-store.ts` - Current view, selected date, calendar state
- Persisted to localStorage with key `todo-list-view-storage`

### API Endpoints

Task endpoints:
- `/api/todos/daily?date=YYYY-MM-DD` - Tasks for a specific day
- `/api/todos/weekly?startDate=YYYY-MM-DD` - Tasks for a week
- `/api/todos/monthly?year=YYYY&month=MM` - Tasks for a month
- `/api/todos/quarterly?startDate=YYYY-MM-DD` - Milestone tasks
- `/api/todos/yearly?year=YYYY` - Year statistics
- `/api/todos/batch` - Batch operations (delete, status change)
- `/api/seed` - Initialize default categories and levels

### Recurring Task Sync

Recurring tasks are auto-generated when viewing daily/weekly/monthly data:
1. Active `RecurrenceRule` records are queried
2. `calculateOccurrenceDates()` computes dates within the time window
3. Task instances are created if they don't exist (via `parentRuleId` check)

See `src/services/recurrence-service.ts` for implementation.

## Important Patterns

### Date Handling
- All dates stored as ISO strings: `YYYY-MM-DD`
- Use `src/lib/date-utils.ts` for date operations
- Avoid `Date` object manipulation directly

### Prisma Client
- Import from `@/lib/db.ts`: `import { db } from '@/lib/db'`
- Dev mode logs queries/errors/warnings
- Uses global singleton pattern to prevent connection pool exhaustion

### API Route Structure
```typescript
// Example: src/app/api/todos/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Query params...
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  // Create logic...
  return NextResponse.json(created);
}
```

### First-time Setup
After deployment, visit `/api/seed` to initialize default categories and levels.

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` - PostgreSQL connection string (connection pooling)
- `DIRECT_URL` - Direct PostgreSQL connection (for migrations)