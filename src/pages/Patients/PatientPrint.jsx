import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from '../../lib/toast'
import PrintDocument from '../../components/PrintDocument'
import { SkeletonList } from '../../components/ui/Skeleton'

export default function PatientPrint() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [treatmentPlans, setTreatmentPlans] = useState([])
  const [clinicName, setClinicName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    const patientRes = await supabase
      .from('patients')
      .select('*, clinics(name)')
      .eq('id', id)
      .single()

    if (patientRes.error) {
      toast.error('Fehler beim Laden: ' + patientRes.error.message)
      setLoading(false)
      return
    }

    const plansRes = await supabase
      .from('treatment_plans')
      .select('id, title, status, created_at')
      .eq('patient_id', id)
      .order('created_at', { ascending: false })

    setPatient(patientRes.data)
    setClinicName(patientRes.data.clinics?.name)
    setTreatmentPlans(plansRes.data ?? [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <SkeletonList rows={4} />
      </div>
    )
  }

  if (!patient) return null

  return (
    <PrintDocument
      backTo={`/patients/${id}`}
      clinicName={clinicName}
      documentTitle="Patientenakte"
    >
      <div className="mb-6">
        <p className="text-xl font-bold text-gray-800">{patient.full_name}</p>
      </div>

      <table className="w-full text-sm mb-6">
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="py-2 text-gray-400 w-40">Geburtsdatum</td>
            <td className="py-2 text-gray-800">{patient.date_of_birth || '—'}</td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="py-2 text-gray-400">Telefon</td>
            <td className="py-2 text-gray-800">{patient.phone || '—'}</td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="py-2 text-gray-400">E-Mail</td>
            <td className="py-2 text-gray-800">{patient.email || '—'}</td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="py-2 text-gray-400">Adresse</td>
            <td className="py-2 text-gray-800">{patient.address || '—'}</td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="py-2 text-gray-400">Einwilligung (Consent)</td>
            <td className="py-2 text-gray-800">
              {patient.consent_given
                ? `Erteilt am ${new Date(patient.consent_date).toLocaleDateString('de-AT')}`
                : 'Nicht erteilt'}
            </td>
          </tr>
        </tbody>
      </table>

      {patient.medical_history && (
        <div className="mb-6">
          <p className="text-gray-400 uppercase text-xs tracking-wide mb-1">Krankengeschichte</p>
          <p className="text-gray-800 whitespace-pre-wrap">{patient.medical_history}</p>
        </div>
      )}

      {treatmentPlans.length > 0 && (
        <div>
          <p className="text-gray-400 uppercase text-xs tracking-wide mb-2">Behandlungspläne</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-2">Titel</th>
                <th className="pb-2">Datum</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {treatmentPlans.map((p) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="py-1.5">{p.title}</td>
                  <td className="py-1.5">{new Date(p.created_at).toLocaleDateString('de-AT')}</td>
                  <td className="py-1.5">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PrintDocument>
  )
}
