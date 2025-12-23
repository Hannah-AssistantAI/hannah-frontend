import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { RealtimeProvider } from './contexts/RealtimeContext'

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
