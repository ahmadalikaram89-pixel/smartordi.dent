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

function generateInvoiceNumber() {
  const now = new Date()
  const y = now.getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `R-${y}-${rand}`
}

export default function InvoiceForm() {
  const { clinicId } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedPatientId = searchParams.get('patient_id') || ''

  const [patients, setPatients] = useState([])
  const [treatmentPlans, setTreatmentPlans] = useState([])
  const [form, setForm] = useState({
    patient_id: preselectedPatientId,
    treatment_plan_id: '',
    invoice_number: generateInvoiceNumber(),
    total_amount: '',
    due_date: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (clinicId) loadPatients()
  }, [clinicId])

  useEffect(() => {
    if (form.patient_id) loadTreatmentPlans(form.patient_id)
    else setTreatmentPlans([])
  }, [form.patient_id])

  async function loadPatients() {
    const { data, error } = await supabase
      .from('patients')
      .select('id, full_name')
      .eq('clinic_id', clinicId)
      .order('full_name')
    if (!error) setPatients(data)
  }

  async function loadTreatmentPlans(patientId) {
    const { data, error } = await supabase
      .from('treatment_plans')
      .select('id, title, treatment_items(cost)')
      .eq('patient_id', patientId)
    if (!error) setTreatmentPlans(data)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function handlePlanChange(e) {
    const planId = e.target.value
    const plan = treatmentPlans.find((p) => p.id === planId)
    const suggestedTotal = plan
      ? plan.treatment_items.reduce((sum, it) => sum + (Number(it.cost) || 0), 0)
      : ''
    setForm((f) => ({
      ...f,
      treatment_plan_id: planId,
      total_amount: suggestedTotal ? String(suggestedTotal) : f.total_amount,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.patient_id || !form.invoice_number || !form.total_amount) {
      setError('Bitte Patient, Rechnungsnummer und Betrag angeben.')
      return
    }

    setSaving(true)

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        clinic_id: clinicId,
        patient_id: form.patient_id,
        invoice_number: form.invoice_number,
        total_amount: Number(form.total_amount),
        due_date: form.due_date || null,
        status: 'draft',
      })
      .select()
      .single()

    setSaving(false)

    if (error) {
      toast.error('Fehler beim Speichern: ' + error.message)
    } else {
      toast.success('Rechnung erstellt.')
      navigate(`/billing/${data.id}`)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Neue Rechnung</h1>

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

          {treatmentPlans.length > 0 && (
            <FormField label="Behandlungsplan (optional, übernimmt Betrag)" htmlFor="treatment_plan_id">
              <Select id="treatment_plan_id" value={form.treatment_plan_id} onChange={handlePlanChange}>
                <option value="">Kein Plan</option>
                {treatmentPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          <FormField label="Rechnungsnummer" htmlFor="invoice_number" required>
            <Input
              id="invoice_number"
              name="invoice_number"
              value={form.invoice_number}
              onChange={handleChange}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Betrag (€)" htmlFor="total_amount" required>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                min="0"
                name="total_amount"
                value={form.total_amount}
                onChange={handleChange}
              />
            </FormField>
            <FormField label="Fällig am" htmlFor="due_date">
              <Input
                id="due_date"
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
              />
            </FormField>
          </div>

          {error && <p className="text-danger-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving}>
              {saving ? 'Speichern...' : 'Rechnung erstellen'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/billing')}>
              Abbrechen
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
