# RailView Agent Guidelines

## Development Commands
- `npm run dev` - Start development server on port 9002
- `npm run build` - Production build (NODE_ENV=production)
- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript checking without emit
- `npm run genkit:dev` - Start AI development server
- `npm run genkit:watch` - AI development with watch mode

## Important Development Notes
- **DO NOT run `npm run dev`** - This command will block the agent and prevent completion of tasks
- Use `npm run typecheck` and `npm run lint` to validate code changes
- Test functionality by building and running locally outside of the agent session

## Code Style Guidelines

### Imports
- External libraries first, then internal with `@/` alias
- UI components: `import { Button } from '@/components/ui/button'`
- Utilities: `import { cn } from '@/lib/utils'`
- Icons: `import { Train, Search } from 'lucide-react'`

### Component Patterns
- Use `React.forwardRef` for ref forwarding
- Apply `cn()` utility for conditional class merging
- Follow shadcn/ui patterns with CVA for variants
- TypeScript interfaces extending HTML attributes

### TypeScript
- Use strict mode with proper interfaces
- Zod schemas for AI flow validation
- Generate types: `export type Input = z.infer<typeof Schema>`
- Path alias: `@/*` maps to `./src/*`

### Error Handling
- API routes: try-catch-finally with proper cleanup
- Frontend: console.error with fallback return values
- Always return meaningful error responses

### Naming Conventions
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Files: kebab-case for directories, camelCase for files
- Variables: camelCase, constants UPPER_SNAKE_CASE

### Styling
- Tailwind CSS with CSS variables for theming
- Consistent color tokens from design system
- Responsive design with mobile-first approach
- Use existing UI components from shadcn/ui

### Database
- MongoDB aggregation pipelines for complex queries
- Proper connection management with try-finally
- Use TypeScript interfaces for data models