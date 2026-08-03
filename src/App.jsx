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
import TreatmentList from './pages/Treatments/TreatmentList'
import TreatmentPlanForm from './pages/Treatments/TreatmentPlanForm'
import TreatmentPlanDetail from './pages/Treatments/TreatmentPlanDetail'
import InvoiceList from './pages/Billing/InvoiceList'
import InvoiceForm from './pages/Billing/InvoiceForm'
import InvoiceDetail from './pages/Billing/InvoiceDetail'

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
        <Route path="/treatments" element={<TreatmentList />} />
        <Route path="/treatments/new" element={<TreatmentPlanForm />} />
        <Route path="/treatments/:id" element={<TreatmentPlanDetail />} />
        <Route path="/billing" element={<InvoiceList />} />
        <Route path="/billing/new" element={<InvoiceForm />} />
        <Route path="/billing/:id" element={<InvoiceDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
