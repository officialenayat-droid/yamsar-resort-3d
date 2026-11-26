import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { audio } from './audio/AudioEngine'
import { loadConfig } from './state/config'

if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__audio = audio

const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin'
const App = lazy(() => import('./App.tsx'))
const AdminApp = lazy(() => import('./admin/AdminApp.tsx'))

if (!isAdmin) void loadConfig()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div className="paper min-h-screen" />}>{isAdmin ? <AdminApp /> : <App />}</Suspense>
  </StrictMode>,
)
