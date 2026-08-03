import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

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
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Patienten gesamt</p>
          <p className="text-2xl font-bold text-gray-800">{stats.patients}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Termine heute</p>
          <p className="text-2xl font-bold text-gray-800">{stats.todayAppointments}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Offene Rechnungen</p>
          <p className="text-2xl font-bold text-gray-800">{stats.openInvoices}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Heutige Termine</h2>
        <Link to="/appointments" className="text-sm text-primary-700 hover:underline">
          Alle Termine →
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-400">Laden...</p>
      ) : upcoming.length === 0 ? (
        <p className="text-gray-400 bg-white rounded-xl shadow-sm p-6">Keine Termine heute.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
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
        </div>
      )}
    </div>
  )
}
