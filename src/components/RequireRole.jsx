import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function RequireRole({ roles, children }) {
  const { role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">Laden...</div>
    )
  }

  if (!roles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
