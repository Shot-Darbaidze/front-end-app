# GitHub Copilot Instructions - Driving Instructor App

> **Last Updated:** October 24, 2025  
> **Project:** Driving Instructor App (Next.js 15.5.0, React 19, TypeScript, Node.js >= 20.19.4)

## 🎯 Project Architecture Overview

This is a **Next.js 15.5.0 app-router SPA** connecting learners with driving instructors. The architecture prioritizes:
- **Component decomposition** (69% code reduction achieved)
- **Custom hooks for state management** (no Redux/Zustand)
- **Centralized API service layer** with caching
- **Type-first development** with strict TypeScript
- **Tailwind CSS only** for styling (no inline CSS)

### Key Design Principles
1. **Pure React** - Use `next.js` app router pages, not HTML/static markup
2. **Hook-based patterns** - Extract reusable logic into custom hooks in `src/hooks/`
3. **Single source of truth** - Constants in `src/config/constants.ts`, validators in `src/utils/validation/`
4. **Colocated tests** - Tests live in `__tests__/` directories next to source files
5. **Zero monolithic pages** - Pages should be ~150-200 lines max; decompose into components

---

## 🏗️ Critical Architecture Patterns

### 1. **Custom Hooks Pattern** (State Management)
Instead of Redux/context, use custom hooks in `src/hooks/`:

**Core hooks (read-only, don't modify):**
- `useForm<T>()` - Form management with built-in validation
- `useInstructorFilters()` - Multi-filter state (budget, rating, city, specialty)
- `usePagination()` - Pagination logic
- `useMultiStepForm()` - Step orchestration for workflows
- `useCache()` - Client-side caching (LRU eviction)
- `useMemoFilter/Sort/Search/Group/Calculate()` - Performance optimizations

**When to create a new hook:**
- Logic used in 2+ components
- Complex state transitions (multiple `useState` calls)
- Side effects that should be testable

**Example pattern (from `useForm.ts`):**
```tsx
export const useForm = <T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>,
  validators?: Validators<T>
) => {
  const [state, setState] = useState<FormState<T>>({...});
  // Return: { values, errors, handleChange, handleBlur, handleSubmit, ... }
};

// Usage in component:
const { values, errors, handleSubmit } = useForm(initialValues, onSubmit, validators);
```

### 2. **API Service Layer** (`src/services/api.ts`)
Centralized HTTP client with:
- Request/response/error interceptors
- Authentication token injection
- Retry logic (3 attempts, exponential backoff)
- Built-in caching with `CacheManager`
- Error standardization

**Never fetch directly in components.** Always use `APIService`:
```tsx
// ❌ WRONG
const data = await fetch('/api/instructors');

// ✅ CORRECT
import { api } from '@/services/api';
const data = await api.get('/instructors');
```

### 3. **Constants Centralization** (`src/config/constants.ts`)
All "magic numbers" and repeated values belong here:
- `LIMITS` - pagination sizes, file upload limits, form constraints
- `REGEX_PATTERNS` - email, phone, password validation patterns
- `TIME_CONFIG` - lesson duration, working hours, calendar ranges
- `PRICING` - currency, defaults
- `API_CONFIG` - base URL, timeouts, retry settings

**Pattern (never hardcode values):**
```tsx
// ❌ WRONG
const pageSizeL = 10;
const maxNameLen = 100;

// ✅ CORRECT
import { LIMITS } from '@/config/constants';
const pageSize = LIMITS.PAGE_SIZE;
const maxNameLen = LIMITS.MAX_NAME_LENGTH;
```

### 4. **Validation Architecture** (`src/utils/validation/`)
Three-layer validation system:
- **validators.ts** - Reusable validator functions (email, phone, password, etc.)
- **schemas.ts** - Pre-built validation schemas for common forms
- **useForm hook** - Runtime validation during form input

**Pattern (from `useForm.ts`):**
```tsx
const validators = {
  email: { required: true, custom: validateEmail },
  password: { required: true, minLength: { value: 8, message: '...' } }
};
const { errors } = useForm(initialValues, onSubmit, validators);
```

---

## 📁 Key Directories & File Locations

| Directory | Purpose | Examples |
|-----------|---------|----------|
| `src/app/` | Next.js app-router pages | `blog/[slug]/page.tsx`, `dashboard/page.tsx` |
| `src/components/` | React components, organized by feature | `find-instructors/`, `account/`, `ui/` |
| `src/hooks/` | Custom React hooks (state management) | `useForm.ts`, `useInstructorFilters.ts` |
| `src/services/` | API client & external service integrations | `api.ts` (HTTP layer), `constants.ts` (API config) |
| `src/config/` | App-wide configuration | `constants.ts` (limits, patterns, time config) |
| `src/utils/validation/` | Validation logic | `validators.ts`, `schemas.ts` |
| `src/contexts/` | React Context (minimal use) | `AuthContext.tsx` (auth state) |
| `src/lib/` | Utility libraries | `cache.ts`, `lessons.ts` |
| `src/__tests__/` | Global test utilities | `test-utils.tsx` (render helpers) |

---

## 🧪 Testing Patterns

### Setup
- Framework: **Jest + React Testing Library**
- Config: `jest.config.ts` with jsdom environment
- Test files: Colocated in `__tests__/` directories (same tree as source)

### Running Tests
```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # Coverage report
npm test -- useForm.test.ts # Specific file
```

### Testing Patterns

**Hook testing (from PROJECT_DOCUMENTATION.md):**
```tsx
import { renderHook, act } from '@testing-library/react';
import { useForm } from '../useForm';

it('should initialize form with default values', () => {
  const { result } = renderHook(() =>
    useForm({ email: '' }, jest.fn(), { email: { required: true } })
  );
  expect(result.current.values.email).toBe('');
});
```

**Component testing:**
```tsx
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

it('should render children', () => {
  render(<ErrorBoundary><div>Child</div></ErrorBoundary>);
  expect(screen.getByText('Child')).toBeInTheDocument();
});
```

**Current Coverage Target:** 50%+ (global threshold in `jest.config.ts`)

---

## 🎨 Code Style & Naming Conventions

### TypeScript & React
- **No `any` types** - Use strict typing
- **Component names** - PascalCase (e.g., `FindInstructorsFilter.tsx`)
- **File names** - PascalCase for components, camelCase for utilities/hooks
- **Props interfaces** - Suffix with `Props` (e.g., `ButtonProps`)
- **Event handlers** - Prefix with `handle` (e.g., `handleClick`, `handleSubmit`)
- **Const over function** - Use `const Name = () => {}` not `function Name() {}`

### Styling
- **Tailwind CSS only** - No inline styles or CSS modules
- **Utility-first** - Use `class:` operator with Tailwind classes
- **Responsive design** - Mobile-first (`sm:`, `md:`, `lg:` prefixes)
- **Theme tokens** - Reference `tailwind.config.ts` for custom colors

**Example (never use inline CSS):**
```tsx
// ✅ CORRECT - Tailwind classes
<div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-md">
  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Click me
  </button>
</div>

// ❌ WRONG - Inline styles
<div style={{ display: 'flex', padding: '24px' }}>
  <button style={{ backgroundColor: '#2563eb' }}>Click me</button>
</div>
```

---

## 🚀 Developer Workflows

### Starting Development
```bash
cd /home/saba/instru
npm install
npm run dev          # Starts on http://localhost:3000
```

### Building & Deployment
```bash
npm run build        # Production build (output in `.next/`)
npm start            # Start production server (requires build first)
npm run lint         # ESLint checks
```

### Common Tasks

**Add a new page:**
1. Create `src/app/[feature]/page.tsx` (app-router)
2. Decompose into components in `src/components/[feature]/`
3. Extract state logic into custom hooks
4. Add tests in `src/components/[feature]/__tests__/`

**Add a new form:**
1. Use `useForm` hook (don't create new form logic)
2. Define validators in `src/utils/validation/validators.ts` if needed
3. Reference validation schemas from `src/utils/validation/schemas.ts`
4. Example: See `account-settings/page.tsx` (uses `useForm` for PersonalInfoForm)

**Add a new API endpoint:**
1. Call through `APIService` in `src/services/api.ts`
2. Use standardized error handling
3. Add caching if GET request (via `CacheManager`)
4. Intercept in request/response interceptors if needed for auth/logging

---

## 📊 Achieved Optimizations (Reference)

The codebase underwent 69% code reduction through component decomposition:

| Page | Original | Optimized | Reduction |
|------|----------|-----------|-----------|
| find-instructors/page.tsx | 1,073 lines | ~200 lines | 81% |
| account-settings/page.tsx | 815 lines | ~250 lines | 69% |
| dashboard/page.tsx | 544 lines | ~200 lines | 63% |

**Lessons learned:** Pages exceeding 300 lines signal need for decomposition.

---

## ⚠️ Common Pitfalls to Avoid

1. **Monolithic pages** - Keep pages <200 lines; extract to components
2. **Hardcoded values** - Use `LIMITS`, `REGEX_PATTERNS`, etc. from constants
3. **Component-level validation** - Use `useForm` hook or validation utils
4. **Direct fetch calls** - Always use `APIService` for HTTP requests
5. **Inline styles** - Use Tailwind CSS classes only
6. **Large files** - Follow single responsibility; create hooks/utilities
7. **Any-typed data** - Define interfaces explicitly (see `AuthContext.tsx` for pattern)

---

## 🔗 Integration Points

**Authentication:** 
- Context: `src/contexts/AuthContext.tsx` (provides `useAuth()` hook)
- State: `user: User | null`, auth methods (`login`, `signup`, `logout`)
- Usage: Wrap app in `<AuthProvider>` at layout level

**Caching:**
- Implementation: `src/lib/cache.ts` (LRU cache with TTL)
- Used by: `APIService` for GET requests automatically
- TTL: 5 minutes (configurable in `LIMITS.CACHE_TTL`)

**Environment Variables:**
- API URL: `process.env.NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3000/api`)
- Build: `npm run build` (Next.js handles `.env.local` auto-loading)

---

## 📚 Reference Files

**Must-read for understanding architecture:**
- `PROJECT_DOCUMENTATION.md` - Complete project overview
- `src/config/constants.ts` - All configuration values
- `src/services/api.ts` - HTTP client with interceptors
- `src/hooks/useForm.ts` - Form management pattern
- `src/hooks/useInstructorFilters.ts` - Multi-filter state pattern

**Example implementations:**
- Account settings form: `src/app/account-settings/page.tsx` (uses `useForm`)
- Find instructors filter: `src/app/find-instructors/page.tsx` (uses `useInstructorFilters`)
- Multi-step signup: `src/app/for-instructors/signup/page.tsx` (uses `useMultiStepForm`)

---

## 💡 When to Ask Questions

Before implementing, clarify:
- Should this be in custom hooks or component state?
- Does this data need caching? (Check `APIService`)
- What constants exist already? (Check `src/config/constants.ts`)
- Is this a common validation? (Check `src/utils/validation/validators.ts`)
- Has a similar feature been implemented? (Search codebase for patterns)

