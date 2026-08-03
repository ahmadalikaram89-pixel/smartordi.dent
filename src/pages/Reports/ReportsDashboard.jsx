import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Users, CalendarDays, Euro, Wallet } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Card from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'

const COLORS = {
  primary: '#2563eb',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#0ea5e9',
  neutral: '#9ca3af',
}

const APPOINTMENT_STATUS_COLORS = {
  scheduled: COLORS.info,
  confirmed: COLORS.success,
  completed: COLORS.neutral,
  cancelled: COLORS.danger,
  no_show: COLORS.warning,
}

const APPOINTMENT_STATUS_LABELS = {
  scheduled: 'Geplant',
  confirmed: 'Bestätigt',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
  no_show: 'Nicht erschienen',
}

const TREATMENT_STATUS_COLORS = {
  planned: COLORS.info,
  in_progress: COLORS.warning,
  completed: COLORS.success,
  cancelled: COLORS.danger,
}

const TREATMENT_STATUS_LABELS = {
  planned: 'Geplant',
  in_progress: 'In Behandlung',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('de-AT', {
    month: 'short',
    year: '2-digit',
  })
}

function lastNMonths(n) {
  const months = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(monthKey(d))
  }
  return months
}

export default function ReportsDashboard() {
  const { clinicId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [patientsByMonth, setPatientsByMonth] = useState([])
  const [appointmentsByStatus, setAppointmentsByStatus] = useState([])
  const [appointmentsThisMonth, setAppointmentsThisMonth] = useState(0)
  const [newPatientsThisMonth, setNewPatientsThisMonth] = useState(0)
  const [revenueCollected, setRevenueCollected] = useState(0)
  const [revenueOutstanding, setRevenueOutstanding] = useState(0)
  const [treatmentByStatus, setTreatmentByStatus] = useState([])

  useEffect(() => {
    if (clinicId) loadReports()
  }, [clinicId])

  async function loadReports() {
    setLoading(true)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)

    const [patientsRes, appointmentsRes, invoicesRes, paymentsRes, treatmentItemsRes] =
      await Promise.all([
        supabase
          .from('patients')
          .select('id, created_at')
          .eq('clinic_id', clinicId)
          .gte('created_at', sixMonthsAgo.toISOString()),
        supabase
          .from('appointments')
          .select('id, start_time, status')
          .eq('clinic_id', clinicId)
          .gte('start_time', sixMonthsAgo.toISOString()),
        supabase.from('invoices').select('total_amount').eq('clinic_id', clinicId),
        supabase.from('payments').select('amount, paid_at'),
        supabase.from('treatment_items').select('status'),
      ])

    // مرضى جدد شهرياً
    const months = lastNMonths(6)
    const patientCounts = Object.fromEntries(months.map((m) => [m, 0]))
    ;(patientsRes.data ?? []).forEach((p) => {
      const key = monthKey(new Date(p.created_at))
      if (key in patientCounts) patientCounts[key] += 1
    })
    setPatientsByMonth(months.map((m) => ({ month: monthLabel(m), count: patientCounts[m] })))

    const thisMonthKey = monthKey(new Date())
    setNewPatientsThisMonth(patientCounts[thisMonthKey] || 0)

    // توزيع حالة المواعيد + عدد هالشهر
    const appointments = appointmentsRes.data ?? []
    const statusCounts = {}
    let thisMonthAppointments = 0
    appointments.forEach((a) => {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1
      if (monthKey(new Date(a.start_time)) === thisMonthKey) thisMonthAppointments += 1
    })
    setAppointmentsByStatus(
      Object.entries(statusCounts).map(([status, value]) => ({
        status,
        label: APPOINTMENT_STATUS_LABELS[status] || status,
        value,
      }))
    )
    setAppointmentsThisMonth(thisMonthAppointments)

    // إيرادات
    const totalInvoiced = (invoicesRes.data ?? []).reduce(
      (sum, inv) => sum + (Number(inv.total_amount) || 0),
      0
    )
    const totalCollected = (paymentsRes.data ?? []).reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    )
    setRevenueCollected(totalCollected)
    setRevenueOutstanding(Math.max(totalInvoiced - totalCollected, 0))

    // توزيع حالة الخطط العلاجية
    const treatmentCounts = {}
    ;(treatmentItemsRes.data ?? []).forEach((it) => {
      treatmentCounts[it.status] = (treatmentCounts[it.status] || 0) + 1
    })
    setTreatmentByStatus(
      Object.entries(treatmentCounts).map(([status, value]) => ({
        status,
        label: TREATMENT_STATUS_LABELS[status] || status,
        value,
      }))
    )

    setLoading(false)
  }

  return (
    <div>
      <PageHeader title="Berichte" subtitle="Übersicht über Praxisaktivität und Finanzen" />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Neue Patienten (Monat)" value={newPatientsThisMonth} icon={Users} />
        <StatCard label="Termine (Monat)" value={appointmentsThisMonth} icon={CalendarDays} />
        <StatCard
          label="Einnahmen gesamt"
          value={`${revenueCollected.toFixed(2)} €`}
          icon={Euro}
        />
        <StatCard
          label="Ausstehend"
          value={`${revenueOutstanding.toFixed(2)} €`}
          icon={Wallet}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Neue Patienten pro Monat</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={patientsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Termine nach Status</h3>
            {appointmentsByStatus.length === 0 ? (
              <p className="text-sm text-gray-400 py-16 text-center">Keine Termine in diesem Zeitraum.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={appointmentsByStatus}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry) => entry.label}
                  >
                    {appointmentsByStatus.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={APPOINTMENT_STATUS_COLORS[entry.status] || COLORS.neutral}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Einnahmen vs. Ausstehend</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                layout="vertical"
                data={[
                  { name: 'Bezahlt', value: revenueCollected, fill: COLORS.success },
                  { name: 'Ausstehend', value: revenueOutstanding, fill: COLORS.warning },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                <Tooltip formatter={(value) => `${Number(value).toFixed(2)} €`} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Behandlungspositionen nach Status</h3>
            {treatmentByStatus.length === 0 ? (
              <p className="text-sm text-gray-400 py-16 text-center">
                Noch keine Behandlungspositionen.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={treatmentByStatus}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry) => entry.label}
                  >
                    {treatmentByStatus.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={TREATMENT_STATUS_COLORS[entry.status] || COLORS.neutral}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
