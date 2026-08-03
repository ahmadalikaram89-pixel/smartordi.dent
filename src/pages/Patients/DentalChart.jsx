import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import toast from '../../lib/toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import FormField from '../../components/ui/FormField'
import { SkeletonList } from '../../components/ui/Skeleton'

const CONDITIONS = [
  { value: 'gesund', label: 'Gesund', color: 'bg-white border-gray-300' },
  { value: 'karies', label: 'Karies', color: 'bg-danger-50 border-danger-400' },
  { value: 'gefuellt', label: 'Gefüllt', color: 'bg-info-50 border-info-400' },
  { value: 'krone', label: 'Krone', color: 'bg-warning-50 border-warning-400' },
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

    if (error) {
      toast.error('Fehler beim Speichern: ' + error.message)
    } else {
      setChart((c) => ({ ...c, [toothNumber]: { condition, notes } }))
      setSelectedTooth(null)
      toast.success(`Zahn ${toothNumber} aktualisiert.`)
    }
  }

  if (loading) return <SkeletonList rows={3} />

  const teeth = Array.from({ length: 32 }, (_, i) => i + 1)

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Zahnschema</h1>
        <Link
          to={`/patients/${id}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Zurück zum Patienten
        </Link>
      </div>

      <Card className="p-6 mb-6">
        <div className="grid grid-cols-8 gap-2 mb-4">
          {teeth.map((n) => {
            const meta = conditionMeta(chart[n]?.condition)
            return (
              <button
                key={n}
                onClick={() => setSelectedTooth(n)}
                className={`aspect-square rounded-lg border-2 text-xs font-semibold flex items-center justify-center transition hover:opacity-80 ${
                  selectedTooth === n ? 'ring-2 ring-primary-500' : ''
                } ${meta.color}`}
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
      </Card>

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
    <Card className="p-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
      <h3 className="font-semibold text-gray-800 mb-4">Zahn Nr. {toothNumber}</h3>

      <FormField label="Zustand" htmlFor="tooth-condition" className="mb-4">
        <Select id="tooth-condition" value={condition} onChange={(e) => setCondition(e.target.value)}>
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Notizen" htmlFor="tooth-notes" className="mb-4">
        <Textarea id="tooth-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </FormField>

      <div className="flex gap-3">
        <Button onClick={() => onSave(condition, notes)} loading={saving}>
          {saving ? 'Speichern...' : 'Speichern'}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Abbrechen
        </Button>
      </div>
    </Card>
  )
}
