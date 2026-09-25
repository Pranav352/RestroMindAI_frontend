import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// Auto-register service worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('[RestroMind PWA] New version available, updating...')
    updateSW(true)
  },
  onOfflineReady() {
    console.log('[RestroMind PWA] Application ready for offline operation.')
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
