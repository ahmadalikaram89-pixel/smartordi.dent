import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function AppointmentForm() {
  const { clinicId } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [patients, setPatients] = useState([])
  const [dentists, setDentists] = useState([])
  const [form, setForm] = useState({
    patient_id: searchParams.get('patient_id') || '',
    dentist_id: '',
    date: '',
    start_time: '',
    duration: '30', // بالدقايق
    notes: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (clinicId) loadOptions()
  }, [clinicId])

  async function loadOptions() {
    const [patientsRes, dentistsRes] = await Promise.all([
      supabase
        .from('patients')
        .select('id, full_name')
        .eq('clinic_id', clinicId)
        .order('full_name'),
      supabase
        .from('user_profiles')
        .select('id, full_name')
        .eq('clinic_id', clinicId)
        .eq('role', 'dentist')
        .order('full_name'),
    ])

    if (!patientsRes.error) setPatients(patientsRes.data)
    if (!dentistsRes.error) setDentists(dentistsRes.data)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.patient_id || !form.dentist_id || !form.date || !form.start_time) {
      setError('Bitte alle Pflichtfelder ausfüllen.')
      return
    }

    const startDateTime = new Date(`${form.date}T${form.start_time}`)
    const endDateTime = new Date(startDateTime.getTime() + Number(form.duration) * 60000)

    setSaving(true)

    const { error } = await supabase.from('appointments').insert({
      clinic_id: clinicId,
      patient_id: form.patient_id,
      dentist_id: form.dentist_id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      notes: form.notes,
      status: 'scheduled',
    })

    setSaving(false)

    if (error) {
      setError('Fehler beim Speichern: ' + error.message)
    } else {
      navigate('/appointments')
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Neuer Termin</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
          <select
            name="patient_id"
            value={form.patient_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Bitte wählen...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zahnarzt/-ärztin *</label>
          <select
            name="dentist_id"
            value={form.dentist_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Bitte wählen...</option>
            {dentists.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Datum *</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Uhrzeit *</label>
            <input
              type="time"
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dauer</label>
          <select
            name="duration"
            value={form.duration}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="15">15 Minuten</option>
            <option value="30">30 Minuten</option>
            <option value="45">45 Minuten</option>
            <option value="60">60 Minuten</option>
            <option value="90">90 Minuten</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2 rounded-lg transition disabled:opacity-50"
          >
            {saving ? 'Speichern...' : 'Termin speichern'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/appointments')}
            className="text-gray-500 hover:text-gray-700 px-5 py-2"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  )
}
