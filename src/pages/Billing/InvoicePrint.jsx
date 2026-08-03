import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from '../../lib/toast'
import PrintDocument from '../../components/PrintDocument'
import { SkeletonList } from '../../components/ui/Skeleton'

const STATUS_LABELS = {
  draft: 'Entwurf',
  sent: 'Gesendet',
  paid: 'Bezahlt',
  partial: 'Teilweise bezahlt',
  overdue: 'Überfällig',
  cancelled: 'Storniert',
}

const PAYMENT_METHODS = {
  cash: 'Bar',
  card: 'Karte',
  transfer: 'Überweisung',
}

export default function InvoicePrint() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [payments, setPayments] = useState([])
  const [clinicName, setClinicName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    const invoiceRes = await supabase
      .from('invoices')
      .select('*, patients(full_name, address, email, phone), clinics(name, address, phone, email)')
      .eq('id', id)
      .single()

    if (invoiceRes.error) {
      toast.error('Fehler beim Laden: ' + invoiceRes.error.message)
      setLoading(false)
      return
    }

    const paymentsRes = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', id)
      .order('paid_at', { ascending: false })

    setInvoice(invoiceRes.data)
    setClinicName(invoiceRes.data.clinics?.name)
    setPayments(paymentsRes.data ?? [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <SkeletonList rows={4} />
      </div>
    )
  }

  if (!invoice) return null

  const paidTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const remaining = Number(invoice.total_amount) - paidTotal

  return (
    <PrintDocument
      backTo={`/billing/${id}`}
      clinicName={clinicName}
      documentTitle={`Rechnung ${invoice.invoice_number}`}
    >
      <div className="grid grid-cols-2 gap-6 text-sm mb-8">
        <div>
          <p className="text-gray-400 uppercase text-xs tracking-wide mb-1">Rechnung an</p>
          <p className="font-medium text-gray-800">{invoice.patients?.full_name}</p>
          {invoice.patients?.address && <p className="text-gray-600">{invoice.patients.address}</p>}
          {invoice.patients?.email && <p className="text-gray-600">{invoice.patients.email}</p>}
        </div>
        <div className="text-right">
          <p className="text-gray-400 uppercase text-xs tracking-wide mb-1">Rechnungsnr.</p>
          <p className="font-medium text-gray-800 mb-2">{invoice.invoice_number}</p>
          <p className="text-gray-400 uppercase text-xs tracking-wide mb-1">Status</p>
          <p className="font-medium text-gray-800">{STATUS_LABELS[invoice.status] || invoice.status}</p>
        </div>
      </div>

      <table className="w-full text-sm mb-6">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-2">Ausgestellt am</th>
            <th className="pb-2">Fällig am</th>
            <th className="pb-2 text-right">Betrag</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="py-2">{invoice.issue_date || '—'}</td>
            <td className="py-2">{invoice.due_date || '—'}</td>
            <td className="py-2 text-right font-medium">{Number(invoice.total_amount).toFixed(2)} €</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-end mb-8">
        <div className="w-56 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Gesamtbetrag</span>
            <span className="font-medium">{Number(invoice.total_amount).toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Bezahlt</span>
            <span className="font-medium">{paidTotal.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold text-gray-800">
            <span>Offen</span>
            <span>{Math.max(remaining, 0).toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {payments.length > 0 && (
        <div>
          <p className="text-gray-400 uppercase text-xs tracking-wide mb-2">Zahlungen</p>
          <table className="w-full text-sm">
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="py-1.5">{new Date(p.paid_at).toLocaleDateString('de-AT')}</td>
                  <td className="py-1.5">{PAYMENT_METHODS[p.payment_method] || p.payment_method}</td>
                  <td className="py-1.5 text-right">{Number(p.amount).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PrintDocument>
  )
}
