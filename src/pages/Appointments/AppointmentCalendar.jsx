import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const STATUS_LABELS = {
  scheduled: { label: 'Geplant', color: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Bestätigt', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Abgeschlossen', color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Storniert', color: 'bg-red-100 text-red-700' },
  no_show: { label: 'Nicht erschienen', color: 'bg-yellow-100 text-yellow-700' },
}

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

export default function AppointmentCalendar() {
  const { clinicId } = useAuth()
  const [day, setDay] = useState(startOfDay(new Date()))
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (clinicId) loadAppointments()
  }, [clinicId, day])

  async function loadAppointments() {
    setLoading(true)
    const dayEnd = addDays(day, 1)

    const { data, error } = await supabase
      .from('appointments')
      .select('id, start_time, end_time, status, notes, patients(full_name), user_profiles(full_name)')
      .eq('clinic_id', clinicId)
      .gte('start_time', day.toISOString())
      .lt('start_time', dayEnd.toISOString())
      .order('start_time', { ascending: true })

    if (!error) setAppointments(data)
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Termine</h1>
        <Link
          to="/appointments/new"
          className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Neuer Termin
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setDay(addDays(day, -1))}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Vorheriger Tag
        </button>
        <span className="font-medium text-gray-700">
          {day.toLocaleDateString('de-AT', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
        <button
          onClick={() => setDay(addDays(day, 1))}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Nächster Tag →
        </button>
        <button
          onClick={() => setDay(startOfDay(new Date()))}
          className="px-3 py-1.5 text-sm text-primary-700 hover:underline"
        >
          Heute
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Laden...</p>
      ) : appointments.length === 0 ? (
        <p className="text-gray-400 bg-white rounded-xl shadow-sm p-6">
          Keine Termine an diesem Tag.
        </p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          {appointments.map((a) => {
            const statusMeta = STATUS_LABELS[a.status] || STATUS_LABELS.scheduled
            return (
              <div key={a.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-gray-800">
                    {new Date(a.start_time).toLocaleTimeString('de-AT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    –{' '}
                    {new Date(a.end_time).toLocaleTimeString('de-AT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {a.patients?.full_name} · Dr. {a.user_profiles?.full_name}
                  </p>
                  {a.notes && <p className="text-xs text-gray-400 mt-1">{a.notes}</p>}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusMeta.color}`}>
                  {statusMeta.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
