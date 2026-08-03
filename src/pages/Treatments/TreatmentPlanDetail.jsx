import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

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
      setError('Fehler beim Laden: ' + planRes.error.message)
    } else {
      setPlan(planRes.data)
    }
    setItems(itemsRes.data ?? [])
    setLoading(false)
  }

  async function updatePlanStatus(status) {
    const { error } = await supabase.from('treatment_plans').update({ status }).eq('id', id)
    if (!error) setPlan((p) => ({ ...p, status }))
  }

  async function updateItemStatus(itemId, status) {
    const completed_date = status === 'completed' ? new Date().toISOString().slice(0, 10) : null
    const { error } = await supabase
      .from('treatment_items')
      .update({ status, completed_date })
      .eq('id', itemId)
    if (!error) {
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
      setError('Fehler beim Speichern: ' + error.message)
    } else {
      setItems((list) => [...list, data])
      setNewItem(EMPTY_ITEM)
    }
  }

  if (loading) return <p className="text-gray-400">Laden...</p>
  if (!plan) return null

  const totalCost = items.reduce((sum, it) => sum + (Number(it.cost) || 0), 0)

  return (
    <div className="max-w-3xl">
      <Link to="/treatments" className="text-sm text-gray-500 hover:underline">
        ← Zurück zu Behandlungsplänen
      </Link>

      <div className="flex items-center justify-between mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{plan.title}</h1>
          <p className="text-sm text-gray-500">
            {plan.patients?.full_name}
            {plan.user_profiles?.full_name ? ` · Dr. ${plan.user_profiles.full_name}` : ''}
          </p>
        </div>

        <select
          value={plan.status}
          onChange={(e) => updatePlanStatus(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2"
        >
          {PLAN_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Zahn</th>
              <th className="px-4 py-3 font-medium">Behandlung</th>
              <th className="px-4 py-3 font-medium">Kosten (€)</th>
              <th className="px-4 py-3 font-medium">Termin</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((it) => (
              <tr key={it.id}>
                <td className="px-4 py-3 text-gray-600">{it.tooth_number || '—'}</td>
                <td className="px-4 py-3 text-gray-800">{it.procedure_name}</td>
                <td className="px-4 py-3 text-gray-600">
                  {it.cost != null ? Number(it.cost).toFixed(2) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">{it.scheduled_date || '—'}</td>
                <td className="px-4 py-3">
                  <select
                    value={it.status}
                    onChange={(e) => updateItemStatus(it.id, e.target.value)}
                    className="text-xs border border-gray-300 rounded-lg px-2 py-1"
                  >
                    {ITEM_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Noch keine Behandlungspositionen.
                </td>
              </tr>
            )}
          </tbody>
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
        </table>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Behandlungsposition hinzufügen</h3>
        <form onSubmit={handleAddItem} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Zahn Nr.</label>
            <input
              type="number"
              min="1"
              max="32"
              name="tooth_number"
              value={newItem.tooth_number}
              onChange={handleNewItemChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Behandlung *</label>
            <input
              type="text"
              name="procedure_name"
              value={newItem.procedure_name}
              onChange={handleNewItemChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Kosten (€)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="cost"
              value={newItem.cost}
              onChange={handleNewItemChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Termin</label>
            <input
              type="date"
              name="scheduled_date"
              value={newItem.scheduled_date}
              onChange={handleNewItemChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="col-span-2 sm:col-span-4">
            <button
              type="submit"
              disabled={savingItem}
              className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {savingItem ? 'Speichern...' : '+ Position hinzufügen'}
            </button>
          </div>
        </form>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </div>
    </div>
  )
}
