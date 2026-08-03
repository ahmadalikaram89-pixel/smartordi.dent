import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function PatientProfile() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPatient()
  }, [id])

  async function loadPatient() {
    setLoading(true)

    const [patientRes, appointmentsRes] = await Promise.all([
      supabase.from('patients').select('*').eq('id', id).single(),
      supabase
        .from('appointments')
        .select('id, start_time, status, user_profiles(full_name)')
        .eq('patient_id', id)
        .order('start_time', { ascending: false })
        .limit(10),
    ])

    if (patientRes.error) {
      setError('Fehler beim Laden des Patienten: ' + patientRes.error.message)
    } else {
      setPatient(patientRes.data)
    }
    setAppointments(appointmentsRes.data ?? [])
    setLoading(false)
  }

  if (loading) return <p className="text-gray-400">Laden...</p>
  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!patient) return null

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{patient.full_name}</h1>
        <div className="flex gap-3">
          <Link
            to={`/patients/${id}/chart`}
            className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Zahnschema
          </Link>
          <Link
            to={`/patients/${id}/edit`}
            className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Bearbeiten
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-400">Geburtsdatum</p>
          <p className="text-gray-800">{patient.date_of_birth || '—'}</p>
        </div>
        <div>
          <p className="text-gray-400">Telefon</p>
          <p className="text-gray-800">{patient.phone || '—'}</p>
        </div>
        <div>
          <p className="text-gray-400">E-Mail</p>
          <p className="text-gray-800">{patient.email || '—'}</p>
        </div>
        <div>
          <p className="text-gray-400">Adresse</p>
          <p className="text-gray-800">{patient.address || '—'}</p>
        </div>
        {patient.medical_history && (
          <div className="col-span-2">
            <p className="text-gray-400">Krankengeschichte</p>
            <p className="text-gray-800 whitespace-pre-wrap">{patient.medical_history}</p>
          </div>
        )}
        <div className="col-span-2">
          <p className="text-gray-400">Einwilligung (Consent)</p>
          <p className="text-gray-800">
            {patient.consent_given
              ? `Erteilt am ${new Date(patient.consent_date).toLocaleDateString('de-AT')}`
              : 'Nicht erteilt'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">Letzte Termine</h2>
        <Link
          to={`/appointments/new?patient_id=${id}`}
          className="text-sm text-primary-700 hover:underline"
        >
          + Neuer Termin
        </Link>
      </div>

      {appointments.length === 0 ? (
        <p className="text-gray-400 bg-white rounded-xl shadow-sm p-6">Keine Termine vorhanden.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          {appointments.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-gray-800">
                {new Date(a.start_time).toLocaleString('de-AT', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
              <span className="text-gray-500">Dr. {a.user_profiles?.full_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
