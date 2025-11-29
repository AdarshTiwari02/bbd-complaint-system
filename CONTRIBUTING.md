# Contributing Guide

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- Git

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd bbd-complaint-system
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Start infrastructure services**
```bash
docker-compose up -d postgres redis
```

4. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your local settings
```

5. **Setup database**
```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

6. **Start development servers**
```bash
pnpm dev
```

This starts:
- Backend: http://localhost:3001
- Frontend: http://localhost:3000
- AI Service: http://localhost:3002

## Project Structure

```
bbd-complaint-system/
├── apps/
│   ├── backend/          # NestJS API
│   ├── frontend/         # React SPA
│   └── ai-service/       # AI microservice
├── prisma/               # Database schema
├── shared/               # Shared types & utils
├── infra/                # Infrastructure configs
├── docs/                 # Documentation
└── .github/              # CI/CD workflows
```

## Code Style

### TypeScript
- Strict mode enabled
- Use interfaces over types for objects
- Use enums for fixed sets of values
- Avoid `any`, use `unknown` when needed

### Naming Conventions
- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Interfaces: `PascalCase` (no I prefix)

### Imports
```typescript
// External modules first
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Internal modules (absolute imports)
import { PrismaService } from '@/prisma/prisma.service';
import { UserDto } from './dto/user.dto';

// Types
import type { User } from '@bbd/shared';
```

## Git Workflow

### Branch Naming
```
feature/ticket-routing
bugfix/auth-refresh-token
hotfix/sla-calculation
chore/update-dependencies
```

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(tickets): add auto-escalation logic
fix(auth): handle expired refresh tokens
docs(api): update swagger descriptions
refactor(queue): optimize job processing
test(tickets): add routing unit tests
chore(deps): update prisma to 5.22
```

### Pull Request Process

1. Create feature branch from `develop`
2. Make changes with meaningful commits
3. Ensure tests pass: `pnpm test`
4. Ensure lint passes: `pnpm lint`
5. Create PR to `develop`
6. Get code review approval
7. Squash and merge

## Testing

### Unit Tests
```bash
# Run all unit tests
pnpm test

# Run with coverage
pnpm test:cov

# Run specific test file
pnpm test -- tickets.service.spec.ts
```

### E2E Tests
```bash
# Start test database
docker-compose up -d postgres-test

# Run e2e tests
pnpm test:e2e
```

### Test Structure
```typescript
describe('TicketsService', () => {
  describe('create', () => {
    it('should create a ticket with generated number', async () => {
      // Arrange
      const dto = { title: 'Test', description: '...' };
      
      // Act
      const result = await service.create(dto, userId);
      
      // Assert
      expect(result.ticketNumber).toMatch(/^TKT-\d{4}-\d{5}$/);
    });
  });
});
```

## API Development

### Adding a New Endpoint

1. **Create DTO**
```typescript
// dto/create-feature.dto.ts
export class CreateFeatureDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

2. **Add Service Method**
```typescript
// feature.service.ts
async create(dto: CreateFeatureDto): Promise<Feature> {
  return this.prisma.feature.create({ data: dto });
}
```

3. **Add Controller Route**
```typescript
// feature.controller.ts
@Post()
@ApiOperation({ summary: 'Create a feature' })
async create(@Body() dto: CreateFeatureDto) {
  return this.featureService.create(dto);
}
```

4. **Add Tests**
```typescript
// feature.service.spec.ts
describe('create', () => {
  it('should create feature', async () => {
    // ...
  });
});
```

5. **Update Swagger**
```typescript
@ApiTags('features')
@Controller('features')
export class FeatureController {}
```

## Database Changes

### Adding a Migration

1. **Update Prisma schema**
```prisma
model NewFeature {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
}
```

2. **Generate migration**
```bash
pnpm db:migrate
```

3. **Test migration**
```bash
pnpm db:migrate:reset  # Reset and re-run all migrations
```

## Frontend Development

### Component Structure
```
components/
├── ui/                 # Reusable UI components (shadcn)
├── features/           # Feature-specific components
│   ├── tickets/
│   │   ├── TicketCard.tsx
│   │   └── TicketList.tsx
└── layouts/            # Layout components
```

### State Management (Zustand)
```typescript
// stores/tickets.store.ts
interface TicketsState {
  tickets: Ticket[];
  loading: boolean;
  fetchTickets: () => Promise<void>;
}

export const useTicketsStore = create<TicketsState>((set) => ({
  tickets: [],
  loading: false,
  fetchTickets: async () => {
    set({ loading: true });
    const tickets = await api.get('/tickets');
    set({ tickets: tickets.data, loading: false });
  },
}));
```

### API Calls
```typescript
// Use the centralized api instance
import { api } from '@/lib/api';

const response = await api.get('/tickets');
const created = await api.post('/tickets', data);
```

## Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No console.log statements
- [ ] No hardcoded values (use env vars)
- [ ] Error handling is appropriate
- [ ] Security considerations addressed
- [ ] Performance impact considered

## Need Help?

- Check existing documentation in `/docs`
- Ask in the team chat
- Create an issue for unclear requirements

