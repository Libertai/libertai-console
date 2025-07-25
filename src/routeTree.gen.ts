/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { Route as rootRouteImport } from './routes/__root'
import { Route as UsageRouteImport } from './routes/usage'
import { Route as TransactionsRouteImport } from './routes/transactions'
import { Route as TopUpRouteImport } from './routes/top-up'
import { Route as DashboardRouteImport } from './routes/dashboard'
import { Route as ApiKeysRouteImport } from './routes/api-keys'
import { Route as AgentsRouteImport } from './routes/agents'
import { Route as IndexRouteImport } from './routes/index'

const UsageRoute = UsageRouteImport.update({
  id: '/usage',
  path: '/usage',
  getParentRoute: () => rootRouteImport,
} as any)
const TransactionsRoute = TransactionsRouteImport.update({
  id: '/transactions',
  path: '/transactions',
  getParentRoute: () => rootRouteImport,
} as any)
const TopUpRoute = TopUpRouteImport.update({
  id: '/top-up',
  path: '/top-up',
  getParentRoute: () => rootRouteImport,
} as any)
const DashboardRoute = DashboardRouteImport.update({
  id: '/dashboard',
  path: '/dashboard',
  getParentRoute: () => rootRouteImport,
} as any)
const ApiKeysRoute = ApiKeysRouteImport.update({
  id: '/api-keys',
  path: '/api-keys',
  getParentRoute: () => rootRouteImport,
} as any)
const AgentsRoute = AgentsRouteImport.update({
  id: '/agents',
  path: '/agents',
  getParentRoute: () => rootRouteImport,
} as any)
const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/agents': typeof AgentsRoute
  '/api-keys': typeof ApiKeysRoute
  '/dashboard': typeof DashboardRoute
  '/top-up': typeof TopUpRoute
  '/transactions': typeof TransactionsRoute
  '/usage': typeof UsageRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/agents': typeof AgentsRoute
  '/api-keys': typeof ApiKeysRoute
  '/dashboard': typeof DashboardRoute
  '/top-up': typeof TopUpRoute
  '/transactions': typeof TransactionsRoute
  '/usage': typeof UsageRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/agents': typeof AgentsRoute
  '/api-keys': typeof ApiKeysRoute
  '/dashboard': typeof DashboardRoute
  '/top-up': typeof TopUpRoute
  '/transactions': typeof TransactionsRoute
  '/usage': typeof UsageRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/agents'
    | '/api-keys'
    | '/dashboard'
    | '/top-up'
    | '/transactions'
    | '/usage'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/agents'
    | '/api-keys'
    | '/dashboard'
    | '/top-up'
    | '/transactions'
    | '/usage'
  id:
    | '__root__'
    | '/'
    | '/agents'
    | '/api-keys'
    | '/dashboard'
    | '/top-up'
    | '/transactions'
    | '/usage'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AgentsRoute: typeof AgentsRoute
  ApiKeysRoute: typeof ApiKeysRoute
  DashboardRoute: typeof DashboardRoute
  TopUpRoute: typeof TopUpRoute
  TransactionsRoute: typeof TransactionsRoute
  UsageRoute: typeof UsageRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/usage': {
      id: '/usage'
      path: '/usage'
      fullPath: '/usage'
      preLoaderRoute: typeof UsageRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/transactions': {
      id: '/transactions'
      path: '/transactions'
      fullPath: '/transactions'
      preLoaderRoute: typeof TransactionsRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/top-up': {
      id: '/top-up'
      path: '/top-up'
      fullPath: '/top-up'
      preLoaderRoute: typeof TopUpRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/dashboard': {
      id: '/dashboard'
      path: '/dashboard'
      fullPath: '/dashboard'
      preLoaderRoute: typeof DashboardRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/api-keys': {
      id: '/api-keys'
      path: '/api-keys'
      fullPath: '/api-keys'
      preLoaderRoute: typeof ApiKeysRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/agents': {
      id: '/agents'
      path: '/agents'
      fullPath: '/agents'
      preLoaderRoute: typeof AgentsRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  AgentsRoute: AgentsRoute,
  ApiKeysRoute: ApiKeysRoute,
  DashboardRoute: DashboardRoute,
  TopUpRoute: TopUpRoute,
  TransactionsRoute: TransactionsRoute,
  UsageRoute: UsageRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()
