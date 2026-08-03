import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const EMPTY_FORM = {
  full_name: '',
  date_of_birth: '',
  phone: '',
  email: '',
  address: '',
  medical_history: '',
  consent_given: false,
}

export default function PatientForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { clinicId } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) loadPatient()
  }, [id])

  async function loadPatient() {
    setLoading(true)
    const { data, error } = await supabase.from('patients').select('*').eq('id', id).single()

    if (error) {
      setError('Fehler beim Laden des Patienten: ' + error.message)
    } else {
      setForm({
        full_name: data.full_name || '',
        date_of_birth: data.date_of_birth || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        medical_history: data.medical_history || '',
        consent_given: data.consent_given || false,
      })
    }
    setLoading(false)
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.full_name) {
      setError('Bitte Name eingeben.')
      return
    }

    if (!form.consent_given) {
      setError('Die Einwilligung des Patienten (Consent) ist erforderlich.')
      return
    }

    setSaving(true)

    const payload = {
      ...form,
      consent_date: form.consent_given ? new Date().toISOString() : null,
    }

    let error
    if (isEdit) {
      ;({ error } = await supabase.from('patients').update(payload).eq('id', id))
    } else {
      ;({ error } = await supabase.from('patients').insert({ ...payload, clinic_id: clinicId }))
    }

    setSaving(false)

    if (error) {
      setError('Fehler beim Speichern: ' + error.message)
    } else {
      navigate('/patients')
    }
  }

  if (loading) return <p className="text-gray-400">Laden...</p>

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Patient bearbeiten' : 'Neuer Patient'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vollständiger Name *</label>
          <input
            type="text"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Geburtsdatum</label>
            <input
              type="date"
              name="date_of_birth"
              value={form.date_of_birth}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Krankengeschichte (Allergien, Vorerkrankungen...)
          </label>
          <textarea
            name="medical_history"
            value={form.medical_history}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
          <input
            type="checkbox"
            id="consent_given"
            name="consent_given"
            checked={form.consent_given}
            onChange={handleChange}
            className="mt-1"
          />
          <label htmlFor="consent_given" className="text-sm text-gray-700">
            Der/die Patient:in hat der Verarbeitung seiner/ihrer Gesundheitsdaten gemäß DSGVO
            (Art. 9) ausdrücklich zugestimmt. *
          </label>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2 rounded-lg transition disabled:opacity-50"
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="text-gray-500 hover:text-gray-700 px-5 py-2"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  )
}
