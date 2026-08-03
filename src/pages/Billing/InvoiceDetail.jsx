import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const STATUS_LABELS = {
  draft: 'Entwurf',
  sent: 'Gesendet',
  paid: 'Bezahlt',
  partial: 'Teilweise bezahlt',
  overdue: 'Überfällig',
  cancelled: 'Storniert',
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Bar' },
  { value: 'card', label: 'Karte' },
  { value: 'transfer', label: 'Überweisung' },
]

export default function InvoiceDetail() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newPayment, setNewPayment] = useState({ amount: '', payment_method: 'cash' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadInvoice()
  }, [id])

  async function loadInvoice() {
    setLoading(true)
    const [invoiceRes, paymentsRes] = await Promise.all([
      supabase.from('invoices').select('*, patients(full_name)').eq('id', id).single(),
      supabase.from('payments').select('*').eq('invoice_id', id).order('paid_at', { ascending: false }),
    ])

    if (invoiceRes.error) {
      setError('Fehler beim Laden: ' + invoiceRes.error.message)
    } else {
      setInvoice(invoiceRes.data)
    }
    setPayments(paymentsRes.data ?? [])
    setLoading(false)
  }

  function handlePaymentChange(e) {
    const { name, value } = e.target
    setNewPayment((p) => ({ ...p, [name]: value }))
  }

  async function handleAddPayment(e) {
    e.preventDefault()
    setError('')

    const amount = Number(newPayment.amount)
    if (!amount || amount <= 0) {
      setError('Bitte gültigen Betrag eingeben.')
      return
    }

    setSaving(true)

    const { data, error } = await supabase
      .from('payments')
      .insert({
        invoice_id: id,
        amount,
        payment_method: newPayment.payment_method,
      })
      .select()
      .single()

    if (error) {
      setSaving(false)
      setError('Fehler beim Speichern: ' + error.message)
      return
    }

    const updatedPayments = [data, ...payments]
    const paidTotal = updatedPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    const newStatus = paidTotal >= Number(invoice.total_amount) ? 'paid' : 'partial'

    const { error: statusError } = await supabase
      .from('invoices')
      .update({ status: newStatus })
      .eq('id', id)

    setSaving(false)

    if (!statusError) {
      setPayments(updatedPayments)
      setInvoice((inv) => ({ ...inv, status: newStatus }))
      setNewPayment({ amount: '', payment_method: 'cash' })
    }
  }

  if (loading) return <p className="text-gray-400">Laden...</p>
  if (error && !invoice) return <p className="text-red-600 text-sm">{error}</p>
  if (!invoice) return null

  const paidTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const remaining = Number(invoice.total_amount) - paidTotal

  return (
    <div className="max-w-2xl">
      <Link to="/billing" className="text-sm text-gray-500 hover:underline">
        ← Zurück zur Abrechnung
      </Link>

      <div className="flex items-center justify-between mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{invoice.invoice_number}</h1>
          <p className="text-sm text-gray-500">{invoice.patients?.full_name}</p>
        </div>
        <span className="text-sm font-medium px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">
          {STATUS_LABELS[invoice.status] || invoice.status}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-400">Gesamtbetrag</p>
          <p className="text-gray-800 font-semibold">{Number(invoice.total_amount).toFixed(2)} €</p>
        </div>
        <div>
          <p className="text-gray-400">Bezahlt</p>
          <p className="text-gray-800 font-semibold">{paidTotal.toFixed(2)} €</p>
        </div>
        <div>
          <p className="text-gray-400">Offen</p>
          <p className="text-gray-800 font-semibold">{Math.max(remaining, 0).toFixed(2)} €</p>
        </div>
        <div>
          <p className="text-gray-400">Ausgestellt am</p>
          <p className="text-gray-800">{invoice.issue_date || '—'}</p>
        </div>
        <div>
          <p className="text-gray-400">Fällig am</p>
          <p className="text-gray-800">{invoice.due_date || '—'}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-3">Zahlungen</h2>

      {payments.length === 0 ? (
        <p className="text-gray-400 bg-white rounded-xl shadow-sm p-6 mb-6">Noch keine Zahlungen.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100 mb-6">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-gray-800">{Number(p.amount).toFixed(2)} €</span>
              <span className="text-gray-500">
                {PAYMENT_METHODS.find((m) => m.value === p.payment_method)?.label || p.payment_method}
              </span>
              <span className="text-gray-400">
                {new Date(p.paid_at).toLocaleDateString('de-AT')}
              </span>
            </div>
          ))}
        </div>
      )}

      {remaining > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Zahlung erfassen</h3>
          <form onSubmit={handleAddPayment} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Betrag (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="amount"
                value={newPayment.amount}
                onChange={handlePaymentChange}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Zahlungsart</label>
              <select
                name="payment_method"
                value={newPayment.payment_method}
                onChange={handlePaymentChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'Speichern...' : '+ Zahlung hinzufügen'}
            </button>
          </form>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        </div>
      )}
    </div>
  )
}
