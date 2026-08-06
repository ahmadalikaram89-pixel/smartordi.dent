import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, CalendarClock, Receipt, CalendarX2, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import StatCard from '../components/ui/StatCard'
import Card from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export default function Dashboard() {
  const { profile, clinicId } = useAuth()
  const [stats, setStats] = useState({ patients: 0, todayAppointments: 0, openInvoices: 0 })
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (clinicId) loadDashboard()
  }, [clinicId])

  async function loadDashboard() {
    setLoading(true)
    const todayStart = startOfDay(new Date())
    const todayEnd = addDays(todayStart, 1)

    const [patientsRes, appointmentsRes, invoicesRes, upcomingRes] = await Promise.all([
      supabase.from('patients').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .gte('start_time', todayStart.toISOString())
        .lt('start_time', todayEnd.toISOString()),
      supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .in('status', ['draft', 'sent', 'partial', 'overdue']),
      supabase
        .from('appointments')
        .select('id, start_time, status, patients(full_name)')
        .eq('clinic_id', clinicId)
        .gte('start_time', todayStart.toISOString())
        .lt('start_time', todayEnd.toISOString())
        .order('start_time', { ascending: true })
        .limit(5),
    ])

    setStats({
      patients: patientsRes.count ?? 0,
      todayAppointments: appointmentsRes.count ?? 0,
      openInvoices: invoicesRes.count ?? 0,
    })
    setUpcoming(upcomingRes.data ?? [])
    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Willkommen{profile?.full_name ? `, ${profile.full_name}` : ''}
      </h1>
      <p className="text-gray-500 mb-6">Übersicht für heute</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Patienten gesamt" value={stats.patients} icon={Users} />
        <StatCard label="Termine heute" value={stats.todayAppointments} icon={CalendarClock} />
        <StatCard label="Offene Rechnungen" value={stats.openInvoices} icon={Receipt} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Heutige Termine</h2>
        <Link
          to="/appointments"
          className="flex items-center gap-1 text-sm text-primary-700 hover:underline"
        >
          Alle Termine
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading ? (
        <Card className="divide-y divide-gray-100">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </Card>
      ) : upcoming.length === 0 ? (
        <EmptyState icon={CalendarX2} title="Keine Termine heute" />
      ) : (
        <Card className="divide-y divide-gray-100">
          {upcoming.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-gray-600">
                {new Date(a.start_time).toLocaleTimeString('de-AT', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="font-medium text-gray-800">{a.patients?.full_name}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
