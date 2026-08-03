import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Receipt } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { SkeletonTable } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

const STATUS_LABELS = {
  draft: { label: 'Entwurf', tone: 'neutral' },
  sent: { label: 'Gesendet', tone: 'info' },
  paid: { label: 'Bezahlt', tone: 'success' },
  partial: { label: 'Teilweise bezahlt', tone: 'warning' },
  overdue: { label: 'Überfällig', tone: 'danger' },
  cancelled: { label: 'Storniert', tone: 'neutral' },
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
      <PageHeader
        title="Abrechnung"
        action={
          <Button as={Link} to="/billing/new">
            <Plus className="h-4 w-4" />
            Neue Rechnung
          </Button>
        }
      />

      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-sm px-3 py-1.5 rounded-lg border transition ${
              filter === f.value
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50 bg-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="Keine Rechnungen gefunden" />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Rechnungsnr.</TH>
              <TH>Patient</TH>
              <TH>Betrag (€)</TH>
              <TH>Fällig am</TH>
              <TH>Status</TH>
            </tr>
          </THead>
          <TBody>
            {filtered.map((inv) => {
              const statusMeta = STATUS_LABELS[inv.status] || STATUS_LABELS.draft
              return (
                <TR key={inv.id}>
                  <TD>
                    <Link
                      to={`/billing/${inv.id}`}
                      className="text-primary-700 font-medium hover:underline"
                    >
                      {inv.invoice_number}
                    </Link>
                  </TD>
                  <TD>{inv.patients?.full_name}</TD>
                  <TD>{Number(inv.total_amount).toFixed(2)}</TD>
                  <TD>{inv.due_date || '—'}</TD>
                  <TD>
                    <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                  </TD>
                </TR>
              )
            })}
          </TBody>
        </Table>
      )}
    </div>
  )
}
