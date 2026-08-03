import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const STATUS_LABELS = {
  draft: { label: 'Entwurf', color: 'bg-gray-100 text-gray-600' },
  sent: { label: 'Gesendet', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Bezahlt', color: 'bg-green-100 text-green-700' },
  partial: { label: 'Teilweise bezahlt', color: 'bg-yellow-100 text-yellow-700' },
  overdue: { label: 'Überfällig', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Storniert', color: 'bg-gray-100 text-gray-400' },
}

const FILTERS = [
  { value: 'all', label: 'Alle' },
  { value: 'paid', label: 'Bezahlt' },
  { value: 'overdue', label: 'Überfällig' },
]

export default function InvoiceList() {
  const { clinicId } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (clinicId) loadInvoices()
  }, [clinicId])

  async function loadInvoices() {
    setLoading(true)
    const { data, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, status, issue_date, due_date, patients(full_name)')
      .eq('clinic_id', clinicId)
      .order('issue_date', { ascending: false })

    if (!error) setInvoices(data)
    setLoading(false)
  }

  const today = new Date().toISOString().slice(0, 10)
  const filtered = invoices.filter((inv) => {
    if (filter === 'all') return true
    if (filter === 'paid') return inv.status === 'paid'
    if (filter === 'overdue') {
      return inv.status === 'overdue' || (inv.status !== 'paid' && inv.due_date && inv.due_date < today)
    }
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Abrechnung</h1>
        <Link
          to="/billing/new"
          className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Neue Rechnung
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-sm px-3 py-1.5 rounded-lg border transition ${
              filter === f.value
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Laden...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 bg-white rounded-xl shadow-sm p-6">Keine Rechnungen gefunden.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Rechnungsnr.</th>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Betrag (€)</th>
                <th className="px-4 py-3 font-medium">Fällig am</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((inv) => {
                const statusMeta = STATUS_LABELS[inv.status] || STATUS_LABELS.draft
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/billing/${inv.id}`}
                        className="text-primary-700 font-medium hover:underline"
                      >
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{inv.patients?.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{Number(inv.total_amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">{inv.due_date || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusMeta.color}`}>
                        {statusMeta.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
