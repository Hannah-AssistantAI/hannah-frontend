import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { RealtimeProvider } from './contexts/RealtimeContext'

// Build version marker - check this in console to verify deployment
console.log('🚀 Hannah AI Build: 2025-12-25-v1 (timezone fix)')
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <RealtimeProvider>
        <AppProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </AppProvider>
      </RealtimeProvider>
    </AuthProvider>
  </BrowserRouter>
)
