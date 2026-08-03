import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import SetupRequired from './pages/SetupRequired.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { isSupabaseConfigured } from './lib/supabase.js'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isSupabaseConfigured ? (
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    ) : (
      <SetupRequired />
    )}
  </React.StrictMode>,
)
