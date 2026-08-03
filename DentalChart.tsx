import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const CONDITIONS = [
  { value: 'gesund', label: 'Gesund', color: 'bg-white border-gray-300' },
  { value: 'karies', label: 'Karies', color: 'bg-red-100 border-red-400' },
  { value: 'gefuellt', label: 'Gefüllt', color: 'bg-blue-100 border-blue-400' },
  { value: 'krone', label: 'Krone', color: 'bg-yellow-100 border-yellow-400' },
  { value: 'fehlt', label: 'Fehlt / Extrahiert', color: 'bg-gray-300 border-gray-500' },
]

function conditionMeta(value) {
  return CONDITIONS.find((c) => c.value === value) || CONDITIONS[0]
}

export default function DentalChart() {
  const { id } = useParams() // patient id
  const { clinicId, user } = useAuth()
  const [chart, setChart] = useState({}) // { toothNumber: { condition, notes } }
  const [selectedTooth, setSelectedTooth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadChart()
  }, [id])

  async function loadChart() {
    const { data, error } = await supabase
      .from('dental_charts')
      .select('*')
      .eq('patient_id', id)

    if (!error && data) {
      const map = {}
      data.forEach((row) => {
        map[row.tooth_number] = { condition: row.condition, notes: row.notes }
      })
      setChart(map)
    }
    setLoading(false)
  }

  async function saveTooth(toothNumber, condition, notes) {
    setSaving(true)

    const { error } = await supabase.from('dental_charts').upsert(
      {
        clinic_id: clinicId,
        patient_id: id,
        tooth_number: toothNumber,
        condition,
        notes,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'patient_id,tooth_number' }
    )

    setSaving(false)

    if (!error) {
      setChart((c) => ({ ...c, [toothNumber]: { condition, notes } }))
      setSelectedTooth(null)
    }
  }

  if (loading) return <p className="text-gray-400">Laden...</p>

  const teeth = Array.from({ length: 32 }, (_, i) => i + 1)

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Zahnschema</h1>
        <Link to={`/patients/${id}`} className="text-sm text-gray-500 hover:underline">
          ← Zurück zum Patienten
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-8 gap-2 mb-4">
          {teeth.map((n) => {
            const meta = conditionMeta(chart[n]?.condition)
            return (
              <button
                key={n}
                onClick={() => setSelectedTooth(n)}
                className={`aspect-square rounded-lg border-2 text-xs font-semibold flex items-center justify-center transition ${meta.color} hover:opacity-80`}
              >
                {n}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          {CONDITIONS.map((c) => (
            <div key={c.value} className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded border ${c.color}`} />
              {c.label}
            </div>
          ))}
        </div>
      </div>

      {selectedTooth && (
        <ToothEditor
          toothNumber={selectedTooth}
          current={chart[selectedTooth]}
          saving={saving}
          onSave={(condition, notes) => saveTooth(selectedTooth, condition, notes)}
          onClose={() => setSelectedTooth(null)}
        />
      )}
    </div>
  )
}

function ToothEditor({ toothNumber, current, saving, onSave, onClose }) {
  const [condition, setCondition] = useState(current?.condition || 'gesund')
  const [notes, setNotes] = useState(current?.notes || '')

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Zahn Nr. {toothNumber}</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Zustand</label>
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onSave(condition, notes)}
          disabled={saving}
          className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          {saving ? 'Speichern...' : 'Speichern'}
        </button>
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
          Abbrechen
        </button>
      </div>
    </div>
  )
}
