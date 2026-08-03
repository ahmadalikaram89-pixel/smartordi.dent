import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import toast from '../../lib/toast'
import Card from '../../components/ui/Card'
import FormField from '../../components/ui/FormField'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import { SkeletonList } from '../../components/ui/Skeleton'

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
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (isEdit) loadPatient()
  }, [id])

  async function loadPatient() {
    setLoading(true)
    const { data, error } = await supabase.from('patients').select('*').eq('id', id).single()

    if (error) {
      toast.error('Fehler beim Laden des Patienten: ' + error.message)
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
    setValidationError('')

    if (!form.full_name) {
      setValidationError('Bitte Name eingeben.')
      return
    }

    if (!form.consent_given) {
      setValidationError('Die Einwilligung des Patienten (Consent) ist erforderlich.')
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
      toast.error('Fehler beim Speichern: ' + error.message)
    } else {
      toast.success(isEdit ? 'Patient aktualisiert.' : 'Patient angelegt.')
      navigate('/patients')
    }
  }

  if (loading) return <SkeletonList rows={4} />

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Patient bearbeiten' : 'Neuer Patient'}
      </h1>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Vollständiger Name" htmlFor="full_name" required>
            <Input id="full_name" name="full_name" value={form.full_name} onChange={handleChange} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Geburtsdatum" htmlFor="date_of_birth">
              <Input
                id="date_of_birth"
                type="date"
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={handleChange}
              />
            </FormField>
            <FormField label="Telefon" htmlFor="phone">
              <Input id="phone" type="tel" name="phone" value={form.phone} onChange={handleChange} />
            </FormField>
          </div>

          <FormField label="E-Mail" htmlFor="email">
            <Input id="email" type="email" name="email" value={form.email} onChange={handleChange} />
          </FormField>

          <FormField label="Adresse" htmlFor="address">
            <Input id="address" name="address" value={form.address} onChange={handleChange} />
          </FormField>

          <FormField label="Krankengeschichte (Allergien, Vorerkrankungen...)" htmlFor="medical_history">
            <Textarea
              id="medical_history"
              name="medical_history"
              value={form.medical_history}
              onChange={handleChange}
              rows={3}
            />
          </FormField>

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

          {validationError && <p className="text-danger-600 text-sm">{validationError}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving}>
              {saving ? 'Speichern...' : 'Speichern'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/patients')}>
              Abbrechen
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
