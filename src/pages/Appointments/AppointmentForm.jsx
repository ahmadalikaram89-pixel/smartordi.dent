import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import toast from '../../lib/toast'
import Card from '../../components/ui/Card'
import FormField from '../../components/ui/FormField'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import { SkeletonList } from '../../components/ui/Skeleton'

export const APPOINTMENT_REASONS = [
  'Kontrolluntersuchung',
  'Beratung',
  'Zahnreinigung',
  'Schmerzbehandlung',
  'Füllung',
  'Wurzelbehandlung',
  'Zahnextraktion',
  'Zahnersatz / Prothetik',
  'Kieferorthopädie',
  'Nachkontrolle',
  'Notfall',
  'Sonstiges',
]

export default function AppointmentForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
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
    reason: '',
    notes: '',
  })
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (clinicId) loadOptions()
  }, [clinicId])

  useEffect(() => {
    if (isEdit && clinicId) loadAppointment()
  }, [id, clinicId])

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

  async function loadAppointment() {
    setLoading(true)
    const { data, error } = await supabase
      .from('appointments')
      .select('patient_id, dentist_id, start_time, end_time, reason, notes')
      .eq('id', id)
      .single()

    if (error) {
      toast.error('Fehler beim Laden des Termins: ' + error.message)
    } else {
      const start = new Date(data.start_time)
      const end = new Date(data.end_time)
      const durationMinutes = Math.round((end - start) / 60000)
      setForm({
        patient_id: data.patient_id,
        dentist_id: data.dentist_id || '',
        date: start.toISOString().slice(0, 10),
        start_time: start.toTimeString().slice(0, 5),
        duration: String(durationMinutes),
        reason: data.reason || '',
        notes: data.notes || '',
      })
    }
    setLoading(false)
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

    let conflictQuery = supabase
      .from('appointments')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('dentist_id', form.dentist_id)
      .neq('status', 'cancelled')
      .lt('start_time', endDateTime.toISOString())
      .gt('end_time', startDateTime.toISOString())

    if (isEdit) conflictQuery = conflictQuery.neq('id', id)

    const { data: conflicts, error: conflictError } = await conflictQuery

    if (conflictError) {
      setSaving(false)
      toast.error('Fehler bei der Terminprüfung: ' + conflictError.message)
      return
    }

    if (conflicts?.length > 0) {
      setSaving(false)
      setError('Dieser Zahnarzt/diese Zahnärztin hat zu dieser Zeit bereits einen Termin.')
      return
    }

    const payload = {
      patient_id: form.patient_id,
      dentist_id: form.dentist_id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      reason: form.reason || null,
      notes: form.notes,
    }

    let error
    if (isEdit) {
      ;({ error } = await supabase.from('appointments').update(payload).eq('id', id))
    } else {
      ;({ error } = await supabase
        .from('appointments')
        .insert({ ...payload, clinic_id: clinicId, status: 'scheduled' }))
    }

    setSaving(false)

    if (error) {
      toast.error('Fehler beim Speichern: ' + error.message)
    } else {
      toast.success(isEdit ? 'Termin aktualisiert.' : 'Termin angelegt.')
      navigate('/appointments')
    }
  }

  if (loading) return <SkeletonList rows={4} />

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Termin bearbeiten' : 'Neuer Termin'}
      </h1>

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

          <FormField label="Zahnarzt/-ärztin" htmlFor="dentist_id" required>
            <Select id="dentist_id" name="dentist_id" value={form.dentist_id} onChange={handleChange}>
              <option value="">Bitte wählen...</option>
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.full_name}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Datum" htmlFor="date" required>
              <Input id="date" type="date" name="date" value={form.date} onChange={handleChange} />
            </FormField>
            <FormField label="Uhrzeit" htmlFor="start_time" required>
              <Input
                id="start_time"
                type="time"
                name="start_time"
                value={form.start_time}
                onChange={handleChange}
              />
            </FormField>
          </div>

          <FormField label="Dauer" htmlFor="duration">
            <Select id="duration" name="duration" value={form.duration} onChange={handleChange}>
              <option value="15">15 Minuten</option>
              <option value="30">30 Minuten</option>
              <option value="45">45 Minuten</option>
              <option value="60">60 Minuten</option>
              <option value="90">90 Minuten</option>
            </Select>
          </FormField>

          <FormField label="Grund des Termins" htmlFor="reason">
            <Select id="reason" name="reason" value={form.reason} onChange={handleChange}>
              <option value="">Bitte wählen...</option>
              {APPOINTMENT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Notizen" htmlFor="notes">
            <Textarea id="notes" name="notes" value={form.notes} onChange={handleChange} rows={2} />
          </FormField>

          {error && <p className="text-danger-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving}>
              {saving ? 'Speichern...' : 'Termin speichern'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/appointments')}>
              Abbrechen
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
