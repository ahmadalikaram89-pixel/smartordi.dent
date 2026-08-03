import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function TreatmentPlanForm() {
  const { clinicId } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedPatientId = searchParams.get('patient_id') || ''

  const [patients, setPatients] = useState([])
  const [dentists, setDentists] = useState([])
  const [form, setForm] = useState({
    patient_id: preselectedPatientId,
    dentist_id: '',
    title: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (clinicId) loadOptions()
  }, [clinicId])

  async function loadOptions() {
    const [patientsRes, dentistsRes] = await Promise.all([
      supabase.from('patients').select('id, full_name').eq('clinic_id', clinicId).order('full_name'),
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

    if (!form.patient_id || !form.title) {
      setError('Bitte Patient und Titel angeben.')
      return
    }

    setSaving(true)

    const { data, error } = await supabase
      .from('treatment_plans')
      .insert({
        clinic_id: clinicId,
        patient_id: form.patient_id,
        dentist_id: form.dentist_id || null,
        title: form.title,
        status: 'planned',
      })
      .select()
      .single()

    setSaving(false)

    if (error) {
      setError('Fehler beim Speichern: ' + error.message)
    } else {
      navigate(`/treatments/${data.id}`)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Neuer Behandlungsplan</h1>

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
          <label className="block text-sm font-medium text-gray-700 mb-1">Zahnarzt/-ärztin</label>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="z.B. Wurzelbehandlung Zahn 26"
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
            {saving ? 'Speichern...' : 'Plan erstellen'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/treatments')}
            className="text-gray-500 hover:text-gray-700 px-5 py-2"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  )
}
