# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ThingsPanel is a lightweight, componentized open-source IoT application support platform built with Vue 3, TypeScript, and Naive UI. The project focuses on reducing development efforts and accelerating IoT project construction through reusable plugins and components.

## Core Commands

### Development
- `pnpm dev` or `npm run dev` - Start development server on port 5002
- `pnpm dev:test` - Start development server with test environment
- `pnpm dev:prod` - Start development server with production environment

### Build and Deployment
- `pnpm build` - Production build with typecheck (requires 4GB RAM)
- `pnpm build:4096` - Production build with 8GB RAM allocation
- `pnpm build:test` - Test environment build
- `pnpm typecheck` - Run TypeScript type checking (4GB RAM limit)

### Code Quality
- `pnpm lint` - Run ESLint with auto-fix
- `pnpm format` - Run Prettier code formatting
- Pre-commit hooks automatically run `pnpm typecheck && pnpm lint-staged`

### Package Management
- Uses **pnpm** as package manager with workspace configuration
- `pnpm install` - Install dependencies
- Workspaces include internal packages: `@sa/axios`, `@sa/hooks`, `@sa/materials`, `@sa/utils`, etc.

## Architecture Overview

### Monorepo Structure
The project uses pnpm workspaces with internal packages in `packages/`:
- `@sa/axios` - HTTP client wrapper
- `@sa/color-palette` - Color system
- `@sa/hooks` - Shared Vue composables
- `@sa/materials` - UI component library
- `@sa/utils` - Utility functions

### Core Frontend Architecture

#### Technology Stack
- **Framework**: Vue 3 with Composition API (`<script setup>` syntax)
- **Language**: TypeScript with strict mode
- **State Management**: Pinia stores
- **Routing**: Vue Router 4 with `@elegant-router/vue` file-based routing
- **UI Library**: Naive UI as primary component library
- **Styling**: UnoCSS utility-first CSS with `@unocss/preset-uno`
- **Icons**: Iconify via UnoCSS preset (`i-...` classes) and `@vicons/*` components
- **Build Tool**: Vite with custom plugins
- **Internationalization**: Vue I18n with English and Chinese support

#### Key Directory Structure
```
src/
├── views/           # Page components (file-based routing)
├── components/      # Shared components
│   ├── panelv2-clean/  # New clean panel architecture
│   ├── panelv2/        # Legacy panel system
│   └── panel/          # Original panel implementation
├── layouts/         # Layout components
├── store/modules/   # Pinia store modules
├── service/api/     # API service functions
├── hooks/           # Vue composables
├── card/            # Dashboard card components
│   ├── builtin-card/   # Built-in system cards
│   └── chart-card/     # Chart visualization cards
├── utils/           # Utility functions
├── typings/         # TypeScript type definitions
└── locales/         # i18n translation files
```

### Panel System Architecture

The project has evolved through multiple panel system architectures:

#### 1. PanelV2-Clean (Latest Architecture)
- **Location**: `src/components/panelv2-clean/`
- **Design**: Revolutionary two-layer architecture
  - **Layer 1**: Pure Infrastructure Layer (UI layout management)
  - **Layer 2**: Professional Engine Layer (specialized engines)
- **Key Components**:
  - `PureLayoutManager.vue` - Pure UI layout manager
  - `PureDataPipeline.ts` - Data transmission pipeline
  - `engines/` - Various specialized engines (Node, Render, Config, Tool, etc.)
  - `renderers/` - Rendering engine implementations

#### 2. PanelV2 (Previous Architecture)
- **Location**: `src/components/panelv2/`
- **Features**: Canvas-based panel editor with inspector and sidebar
- **Components**: Canvas, Inspector, Sidebar, Toolbar

#### 3. Legacy Panel System
- **Location**: `src/components/panel/`
- **Purpose**: Original panel management system

### Card System
- **Built-in Cards**: System metrics, device status, alarms (`src/card/builtin-card/`)
- **Chart Cards**: Visualization components (`src/card/chart-card/`)
- **Configuration**: Each card has `card-config.vue` for settings and `component.vue` for rendering

## Development Guidelines

### Code Style and Conventions
- **Vue 3**: Use Composition API with `<script setup>` syntax exclusively
- **TypeScript**: Strict mode enabled, avoid `any` type, use `import type` for type-only imports
- **Naming**: PascalCase for components, camelCase for composables/services
- **UI Components**: Use Naive UI components, import as needed
- **Styling**: Prefer UnoCSS utility classes over custom CSS
- **State**: Use Pinia stores for global state, define in `src/store/modules/`
- **API**: Define API functions in `src/service/api/`, strictly type requests/responses
- **Internationalization**: Always use `$t()` or `useI18n()` for user-facing text

### Import Conventions
```typescript
// Type-only imports
import type { MyType } from './types'

// Workspace packages
import { useRequest } from '@sa/hooks'
import { request } from '@sa/axios'

// Path aliases
import Component from '@/components/Component.vue'
import { helper } from '@/utils/helper'
```

### Component Structure
```vue
<script setup lang="ts">
// Type definitions first
interface Props {
  data: MyData[]
}

// Props and emits
const props = defineProps<Props>()
const emit = defineEmits<{
  update: [value: string]
}>()

// Composables and reactive state
const { loading, data } = useRequest(apiCall)
const state = reactive({ ... })

// Computed and watch
const computed = computed(() => ...)
</script>

<template>
  <!-- Use Naive UI components and UnoCSS classes -->
  <n-card class="p-4 mb-4">
    <n-button @click="handleClick">{{ $t('common.confirm') }}</n-button>
  </n-card>
</template>
```

### State Management Patterns
```typescript
// Store definition in src/store/modules/
export const useMyStore = defineStore('my-store', () => {
  const state = reactive({
    data: [] as MyData[]
  })
  
  const getters = computed(() => state.data.length)
  
  const actions = {
    async fetchData() {
      const response = await myApi()
      state.data = response.data
    }
  }
  
  return { state, getters, ...actions }
})
```

### API Service Patterns
```typescript
// In src/service/api/
import { request } from '@sa/axios'

export interface MyApiRequest {
  id: string
}

export interface MyApiResponse {
  data: MyData[]
}

export function fetchMyData(params: MyApiRequest): Promise<MyApiResponse> {
  return request.get<MyApiResponse>('/api/my-data', { params })
}
```

## Routing System

Uses `@elegant-router/vue` with file-based routing:
- Page components in `src/views/` automatically generate routes
- Route metadata can be defined in component comments
- Lazy loading for all route components: `component: () => import('@/views/MyPage.vue')`

## Build Configuration

### Memory Optimization
- Build process requires significant memory (4-8GB)
- Manual chunk splitting for large dependencies
- Parallel file operations limited to 2 for memory efficiency

### Environment Variables
- `VITE_SERVICE_ENV` - Environment (dev/test/prod)
- Development server runs on port 5002
- Preview server runs on port 9725

## Testing and Quality Assurance

### Pre-commit Hooks
- TypeScript type checking (`pnpm typecheck`)
- ESLint with auto-fix on staged files
- Commit message validation

### ESLint Configuration
- Flat Config format (ESLint v9+)
- Vue 3 recommended rules
- TypeScript recommended rules
- Prettier integration
- Custom rules for project-specific needs

## IoT Domain-Specific Features

### Device Management
- Device configuration templates with protocol plugins
- Device grouping and batch operations
- Real-time telemetry data visualization
- Device location mapping (Baidu, Gaode, Tencent maps)

### Dashboard and Visualization
- Card-based dashboard system
- Real-time data charts (ECharts, AntV G2)
- Large screen visualization support
- Mobile-responsive design

### Automation and Rules
- Scene linkage and automation rules
- Alarm notification system
- Rule engine for data processing
- WebSocket for real-time updates

## Performance Considerations

- Virtual scrolling for large device lists
- Lazy loading for route components
- Memory-efficient build process
- Responsive design with UnoCSS utilities
- Chart virtualization for large datasets

## Debugging and Development Tips

- Use Vue DevTools for component inspection
- Vite HMR for fast development feedback
- TypeScript strict mode catches errors early
- ESLint provides real-time code quality feedback
- Use `console.log` (allowed in ESLint config) for debugging