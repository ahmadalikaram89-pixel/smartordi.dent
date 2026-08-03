import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import toast from '../../lib/toast'
import Card from '../../components/ui/Card'
import FormField from '../../components/ui/FormField'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

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
      toast.error('Fehler beim Speichern: ' + error.message)
    } else {
      toast.success('Behandlungsplan erstellt.')
      navigate(`/treatments/${data.id}`)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Neuer Behandlungsplan</h1>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Patient" htmlFor="patient_id" required>
            <Select id="patient_id" name="patient_id" value={form.patient_id} onChange={handleChange}>
              <option value="">Bitte wählen...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Zahnarzt/-ärztin" htmlFor="dentist_id">
            <Select id="dentist_id" name="dentist_id" value={form.dentist_id} onChange={handleChange}>
              <option value="">Bitte wählen...</option>
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.full_name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Titel" htmlFor="title" required>
            <Input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="z.B. Wurzelbehandlung Zahn 26"
            />
          </FormField>

          {error && <p className="text-danger-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving}>
              {saving ? 'Speichern...' : 'Plan erstellen'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/treatments')}>
              Abbrechen
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
