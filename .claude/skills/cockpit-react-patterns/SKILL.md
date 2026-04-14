---
name: cockpit-react-patterns
description: React/TypeScript patterns for GraphClaw Cockpit — component structure, hooks, stores, and shadcn/ui usage. Use when building or reviewing React components.
---

# Cockpit React Patterns

## Component File Structure
- One component per file, named export matching filename
- Props interface defined inline above component
- Co-located test file: `Component.test.tsx`

## Feature Module Pattern
```
src/features/{name}/
├── index.ts          # Public exports
├── {Name}Page.tsx    # Route-level page component
├── components/       # Feature-specific components
├── hooks/            # Feature-specific hooks (useXxxQuery, useXxxMutation)
└── types.ts          # Feature-specific types
```

## TanStack Query Conventions
- Query keys: `['{feature}', '{resource}', params]`
- Queries: `useQuery({ queryKey, queryFn: () => client.GET(...) })`
- Mutations: `useMutation` + `onSuccess: invalidateQueries`
- Optimistic: `onMutate` → update cache → `onError` → rollback

## Zustand Store Pattern
```typescript
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'gc-theme' }
  )
);
```

## shadcn/ui Usage
- Import from `@/components/ui/{component}`
- Extend with `className` prop (Tailwind classes)
- Use `cva` for variant-driven component styling
- Use `cn()` helper (`clsx` + `tailwind-merge`) for class composition
