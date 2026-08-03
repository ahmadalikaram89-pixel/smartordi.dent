import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from '../../lib/toast'
import Card from '../../components/ui/Card'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { SkeletonList } from '../../components/ui/Skeleton'

const PLAN_STATUS_OPTIONS = ['planned', 'in_progress', 'completed', 'cancelled']
const ITEM_STATUS_OPTIONS = ['planned', 'in_progress', 'completed', 'cancelled']

const STATUS_LABELS = {
  planned: 'Geplant',
  in_progress: 'In Behandlung',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
}

const EMPTY_ITEM = { tooth_number: '', procedure_name: '', cost: '', scheduled_date: '' }

export default function TreatmentPlanDetail() {
  const { id } = useParams()
  const [plan, setPlan] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState(EMPTY_ITEM)
  const [savingItem, setSavingItem] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPlan()
  }, [id])

  async function loadPlan() {
    setLoading(true)
    const [planRes, itemsRes] = await Promise.all([
      supabase
        .from('treatment_plans')
        .select('id, title, status, patients(id, full_name), user_profiles(full_name)')
        .eq('id', id)
        .single(),
      supabase.from('treatment_items').select('*').eq('treatment_plan_id', id).order('id'),
    ])

    if (planRes.error) {
      toast.error('Fehler beim Laden: ' + planRes.error.message)
    } else {
      setPlan(planRes.data)
    }
    setItems(itemsRes.data ?? [])
    setLoading(false)
  }

  async function updatePlanStatus(status) {
    const { error } = await supabase.from('treatment_plans').update({ status }).eq('id', id)
    if (error) {
      toast.error('Fehler beim Aktualisieren: ' + error.message)
    } else {
      setPlan((p) => ({ ...p, status }))
    }
  }

  async function updateItemStatus(itemId, status) {
    const completed_date = status === 'completed' ? new Date().toISOString().slice(0, 10) : null
    const { error } = await supabase
      .from('treatment_items')
      .update({ status, completed_date })
      .eq('id', itemId)
    if (error) {
      toast.error('Fehler beim Aktualisieren: ' + error.message)
    } else {
      setItems((list) => list.map((it) => (it.id === itemId ? { ...it, status, completed_date } : it)))
    }
  }

  function handleNewItemChange(e) {
    const { name, value } = e.target
    setNewItem((f) => ({ ...f, [name]: value }))
  }

  async function handleAddItem(e) {
    e.preventDefault()
    setError('')

    if (!newItem.procedure_name) {
      setError('Bitte Bezeichnung der Behandlung angeben.')
      return
    }

    setSavingItem(true)

    const { data, error } = await supabase
      .from('treatment_items')
      .insert({
        treatment_plan_id: id,
        tooth_number: newItem.tooth_number ? Number(newItem.tooth_number) : null,
        procedure_name: newItem.procedure_name,
        cost: newItem.cost ? Number(newItem.cost) : null,
        scheduled_date: newItem.scheduled_date || null,
        status: 'planned',
      })
      .select()
      .single()

    setSavingItem(false)

    if (error) {
      toast.error('Fehler beim Speichern: ' + error.message)
    } else {
      setItems((list) => [...list, data])
      setNewItem(EMPTY_ITEM)
      toast.success('Behandlungsposition hinzugefügt.')
    }
  }

  if (loading) return <SkeletonList rows={4} />
  if (!plan) return null

  const totalCost = items.reduce((sum, it) => sum + (Number(it.cost) || 0), 0)

  return (
    <div className="max-w-3xl">
      <Link
        to="/treatments"
        className="flex items-center gap-1 text-sm text-gray-500 hover:underline w-fit"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Zurück zu Behandlungsplänen
      </Link>

      <div className="flex items-center justify-between mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{plan.title}</h1>
          <p className="text-sm text-gray-500">
            {plan.patients?.full_name}
            {plan.user_profiles?.full_name ? ` · Dr. ${plan.user_profiles.full_name}` : ''}
          </p>
        </div>

        <Select
          value={plan.status}
          onChange={(e) => updatePlanStatus(e.target.value)}
          className="w-auto"
        >
          {PLAN_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>

      <Table className="mb-6">
        <THead>
          <tr>
            <TH>Zahn</TH>
            <TH>Behandlung</TH>
            <TH>Kosten (€)</TH>
            <TH>Termin</TH>
            <TH>Status</TH>
          </tr>
        </THead>
        <TBody>
          {items.map((it) => (
            <TR key={it.id}>
              <TD>{it.tooth_number || '—'}</TD>
              <TD className="text-gray-800">{it.procedure_name}</TD>
              <TD>{it.cost != null ? Number(it.cost).toFixed(2) : '—'}</TD>
              <TD>{it.scheduled_date || '—'}</TD>
              <TD>
                <Select
                  value={it.status}
                  onChange={(e) => updateItemStatus(it.id, e.target.value)}
                  className="w-auto text-xs py-1"
                >
                  {ITEM_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </TD>
            </TR>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                Noch keine Behandlungspositionen.
              </td>
            </tr>
          )}
        </TBody>
        {items.length > 0 && (
          <tfoot>
            <tr className="border-t border-gray-100">
              <td colSpan={2} className="px-4 py-3 text-right font-medium text-gray-600">
                Gesamt
              </td>
              <td className="px-4 py-3 font-medium text-gray-800">{totalCost.toFixed(2)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        )}
      </Table>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Behandlungsposition hinzufügen</h3>
        <form onSubmit={handleAddItem} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Zahn Nr.</label>
            <Input
              type="number"
              min="1"
              max="32"
              name="tooth_number"
              value={newItem.tooth_number}
              onChange={handleNewItemChange}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Behandlung *</label>
            <Input name="procedure_name" value={newItem.procedure_name} onChange={handleNewItemChange} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Kosten (€)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              name="cost"
              value={newItem.cost}
              onChange={handleNewItemChange}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Termin</label>
            <Input
              type="date"
              name="scheduled_date"
              value={newItem.scheduled_date}
              onChange={handleNewItemChange}
            />
          </div>
          <div className="col-span-2 sm:col-span-4">
            <Button type="submit" loading={savingItem} size="sm">
              <Plus className="h-4 w-4" />
              Position hinzufügen
            </Button>
          </div>
        </form>

        {error && <p className="text-danger-600 text-sm mt-3">{error}</p>}
      </Card>
    </div>
  )
}
