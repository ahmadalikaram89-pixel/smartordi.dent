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
import ToothShape from '../../components/dental/ToothShape'
import { UPPER_TEETH, LOWER_TEETH, isMolarTooth } from '../../components/dental/toothTypes'

const CONDITIONS = [
  { value: 'gesund', label: 'Gesund' },
  { value: 'karies', label: 'Karies' },
  { value: 'gefuellt', label: 'Gefüllt' },
  { value: 'krone', label: 'Krone' },
  { value: 'fehlt', label: 'Fehlt / Extrahiert' },
]

const SITES = ['mesial', 'mid', 'distal']
const SITE_LABELS = { mesial: 'M', mid: 'Z', distal: 'D' }

const EMPTY_TOOTH = {
  condition: 'gesund',
  notes: '',
  pd: { mesial: '', mid: '', distal: '' },
  gm: { mesial: '', mid: '', distal: '' },
  cal: { mesial: '', mid: '', distal: '' },
  bleeding: { mesial: false, mid: false, distal: false },
  plaque: { mesial: false, mid: false, distal: false },
  calculus: { mesial: false, mid: false, distal: false },
  mobility: 0,
  furcation: 0,
}

function rowToToothData(row) {
  if (!row) return { ...EMPTY_TOOTH }
  return {
    condition: row.condition || 'gesund',
    notes: row.notes || '',
    pd: { mesial: row.pd_mesial ?? '', mid: row.pd_mid ?? '', distal: row.pd_distal ?? '' },
    gm: { mesial: row.gm_mesial ?? '', mid: row.gm_mid ?? '', distal: row.gm_distal ?? '' },
    cal: { mesial: row.cal_mesial ?? '', mid: row.cal_mid ?? '', distal: row.cal_distal ?? '' },
    bleeding: {
      mesial: !!row.bleeding_mesial,
      mid: !!row.bleeding_mid,
      distal: !!row.bleeding_distal,
    },
    plaque: { mesial: !!row.plaque_mesial, mid: !!row.plaque_mid, distal: !!row.plaque_distal },
    calculus: {
      mesial: !!row.calculus_mesial,
      mid: !!row.calculus_mid,
      distal: !!row.calculus_distal,
    },
    mobility: row.mobility ?? 0,
    furcation: row.furcation ?? 0,
  }
}

function hasAnyBleeding(toothData) {
  return toothData && (toothData.bleeding.mesial || toothData.bleeding.mid || toothData.bleeding.distal)
}

export default function DentalChart() {
  const { id } = useParams() // patient id
  const { clinicId, user } = useAuth()
  const [chart, setChart] = useState({}) // { toothNumber: toothData }
  const [selectedTooth, setSelectedTooth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadChart()
  }, [id])

  async function loadChart() {
    const { data, error } = await supabase.from('dental_charts').select('*').eq('patient_id', id)

    if (!error && data) {
      const map = {}
      data.forEach((row) => {
        map[row.tooth_number] = rowToToothData(row)
      })
      setChart(map)
    }
    setLoading(false)
  }

  async function saveTooth(toothNumber, toothData) {
    setSaving(true)

    const { error } = await supabase.from('dental_charts').upsert(
      {
        clinic_id: clinicId,
        patient_id: id,
        tooth_number: toothNumber,
        condition: toothData.condition,
        notes: toothData.notes,
        pd_mesial: toothData.pd.mesial || null,
        pd_mid: toothData.pd.mid || null,
        pd_distal: toothData.pd.distal || null,
        gm_mesial: toothData.gm.mesial || null,
        gm_mid: toothData.gm.mid || null,
        gm_distal: toothData.gm.distal || null,
        cal_mesial: toothData.cal.mesial || null,
        cal_mid: toothData.cal.mid || null,
        cal_distal: toothData.cal.distal || null,
        bleeding_mesial: toothData.bleeding.mesial,
        bleeding_mid: toothData.bleeding.mid,
        bleeding_distal: toothData.bleeding.distal,
        plaque_mesial: toothData.plaque.mesial,
        plaque_mid: toothData.plaque.mid,
        plaque_distal: toothData.plaque.distal,
        calculus_mesial: toothData.calculus.mesial,
        calculus_mid: toothData.calculus.mid,
        calculus_distal: toothData.calculus.distal,
        mobility: toothData.mobility,
        furcation: toothData.furcation,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'patient_id,tooth_number' }
    )

    setSaving(false)

    if (error) {
      toast.error('Fehler beim Speichern: ' + error.message)
    } else {
      setChart((c) => ({ ...c, [toothNumber]: toothData }))
      setSelectedTooth(null)
      toast.success(`Zahn ${toothNumber} aktualisiert.`)
    }
  }

  if (loading) return <SkeletonList rows={3} />

  return (
    <div className="max-w-4xl">
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

      <Card className="p-6 mb-6 overflow-x-auto">
        <ToothRow
          teeth={UPPER_TEETH}
          arch="upper"
          chart={chart}
          selectedTooth={selectedTooth}
          onSelect={setSelectedTooth}
        />
        <div className="border-t border-dashed border-gray-200 my-2" />
        <ToothRow
          teeth={LOWER_TEETH}
          arch="lower"
          chart={chart}
          selectedTooth={selectedTooth}
          onSelect={setSelectedTooth}
        />

        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
          <Legend color="#ffffff" label="Gesund" />
          <Legend color="#fca5a5" label="Karies" />
          <Legend color="#93c5fd" label="Gefüllt" />
          <Legend color="#fcd34d" label="Krone" />
          <Legend color="#e5e7eb" label="Fehlt" />
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-danger-600" /> Blutung
          </span>
        </div>
      </Card>

      {selectedTooth && (
        <ToothEditor
          toothNumber={selectedTooth}
          data={chart[selectedTooth] || EMPTY_TOOTH}
          saving={saving}
          onSave={(data) => saveTooth(selectedTooth, data)}
          onClose={() => setSelectedTooth(null)}
        />
      )}
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2.5 w-2.5 rounded-sm border border-gray-300" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

function ToothRow({ teeth, arch, chart, selectedTooth, onSelect }) {
  return (
    <div className="flex justify-center gap-0.5">
      {teeth.map((n, idx) => {
        const data = chart[n]
        return (
          <div key={n} className={idx === 8 ? 'ml-3' : ''}>
            <ToothShape
              toothNumber={n}
              arch={arch}
              condition={data?.condition}
              hasBleeding={hasAnyBleeding(data)}
              mobility={data?.mobility || 0}
              selected={selectedTooth === n}
              onClick={() => onSelect(n)}
            />
          </div>
        )
      })}
    </div>
  )
}

function ToothEditor({ toothNumber, data, saving, onSave, onClose }) {
  const [form, setForm] = useState(data)

  useEffect(() => {
    setForm(data)
  }, [toothNumber])

  function updateSite(group, site, value) {
    setForm((f) => ({ ...f, [group]: { ...f[group], [site]: value } }))
  }

  function toggleSite(group, site) {
    setForm((f) => ({ ...f, [group]: { ...f[group], [site]: !f[group][site] } }))
  }

  return (
    <Card className="p-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
      <h3 className="font-semibold text-gray-800 mb-4">Zahn Nr. {toothNumber}</h3>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <FormField label="Zustand" htmlFor="tooth-condition">
          <Select
            id="tooth-condition"
            value={form.condition}
            onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
          >
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Notizen" htmlFor="tooth-notes">
          <Textarea
            id="tooth-notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={1}
          />
        </FormField>
      </div>

      <h4 className="text-sm font-semibold text-gray-700 mb-2">Parodontalstatus</h4>
      <div className="overflow-x-auto mb-4">
        <table className="text-sm border-collapse">
          <thead>
            <tr className="text-gray-400 text-xs">
              <th className="text-left font-medium pr-4 py-1">mm</th>
              {SITES.map((site) => (
                <th key={site} className="px-3 py-1 font-medium">
                  {SITE_LABELS[site]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['pd', 'ST (Sondierungstiefe)'],
              ['gm', 'GM (Zahnfleischrand)'],
              ['cal', 'CAL (Attachment)'],
            ].map(([key, label]) => (
              <tr key={key}>
                <td className="pr-4 py-1 text-gray-600">{label}</td>
                {SITES.map((site) => (
                  <td key={site} className="px-1 py-1">
                    <input
                      type="number"
                      value={form[key][site]}
                      onChange={(e) => updateSite(key, site, e.target.value)}
                      className="w-14 px-2 py-1 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </td>
                ))}
              </tr>
            ))}
            {[
              ['bleeding', 'Blutung', 'bg-danger-500 border-danger-600'],
              ['plaque', 'Plaque', 'bg-warning-500 border-warning-600'],
              ['calculus', 'Zahnstein', 'bg-gray-500 border-gray-600'],
            ].map(([key, label, activeClass]) => (
              <tr key={key}>
                <td className="pr-4 py-1 text-gray-600">{label}</td>
                {SITES.map((site) => (
                  <td key={site} className="px-1 py-1">
                    <button
                      type="button"
                      onClick={() => toggleSite(key, site)}
                      className={`mx-auto block h-5 w-5 rounded-full border-2 transition ${
                        form[key][site] ? activeClass : 'bg-white border-gray-300'
                      }`}
                      aria-label={`${label} ${site}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <FormField label="Zahnlockerung (Mobilität)">
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((grade) => (
              <button
                key={grade}
                type="button"
                onClick={() => setForm((f) => ({ ...f, mobility: grade }))}
                className={`h-8 w-8 rounded-lg border text-sm font-medium transition ${
                  form.mobility === grade
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {grade}
              </button>
            ))}
          </div>
        </FormField>

        {isMolarTooth(toothNumber) && (
          <FormField label="Furkationsbefall">
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, furcation: grade }))}
                  className={`h-8 w-8 rounded-lg border text-sm font-medium transition ${
                    form.furcation === grade
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>
          </FormField>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={() => onSave(form)} loading={saving}>
          {saving ? 'Speichern...' : 'Speichern'}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Abbrechen
        </Button>
      </div>
    </Card>
  )
}
