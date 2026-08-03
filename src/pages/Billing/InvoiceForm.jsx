import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

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
      setError('Fehler beim Speichern: ' + error.message)
    } else {
      navigate(`/billing/${data.id}`)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Neue Rechnung</h1>

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

        {treatmentPlans.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Behandlungsplan (optional, übernimmt Betrag)
            </label>
            <select
              value={form.treatment_plan_id}
              onChange={handlePlanChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Kein Plan</option>
              {treatmentPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rechnungsnummer *</label>
          <input
            type="text"
            name="invoice_number"
            value={form.invoice_number}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Betrag (€) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="total_amount"
              value={form.total_amount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fällig am</label>
            <input
              type="date"
              name="due_date"
              value={form.due_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2 rounded-lg transition disabled:opacity-50"
          >
            {saving ? 'Speichern...' : 'Rechnung erstellen'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/billing')}
            className="text-gray-500 hover:text-gray-700 px-5 py-2"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  )
}
