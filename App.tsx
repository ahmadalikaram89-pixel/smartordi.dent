import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DashboardLayout from './layouts/DashboardLayout'
import PatientList from './pages/Patients/PatientList'
import PatientForm from './pages/Patients/PatientForm'
import PatientProfile from './pages/Patients/PatientProfile'
import DentalChart from './pages/Patients/DentalChart'
import AppointmentCalendar from './pages/Appointments/AppointmentCalendar'
import AppointmentForm from './pages/Appointments/AppointmentForm'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Laden...
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<PatientList />} />
        <Route path="/patients/new" element={<PatientForm />} />
        <Route path="/patients/:id" element={<PatientProfile />} />
        <Route path="/patients/:id/edit" element={<PatientForm />} />
        <Route path="/patients/:id/chart" element={<DentalChart />} />
        <Route path="/appointments" element={<AppointmentCalendar />} />
        <Route path="/appointments/new" element={<AppointmentForm />} />
        {/* هون رح نضيف: /treatments, /billing */}
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
