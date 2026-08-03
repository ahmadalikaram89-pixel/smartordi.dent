import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const STATUS_LABELS = {
  planned: { label: 'Geplant', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Behandlung', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Abgeschlossen', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Storniert', color: 'bg-red-100 text-red-700' },
}

export default function TreatmentList() {
  const { clinicId } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (clinicId) loadPlans()
  }, [clinicId])

  async function loadPlans() {
    setLoading(true)
    const { data, error } = await supabase
      .from('treatment_plans')
      .select('id, title, status, created_at, patients(id, full_name), user_profiles(full_name)')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })

    if (!error) setPlans(data)
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Behandlungspläne</h1>
        <Link
          to="/treatments/new"
          className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Neuer Behandlungsplan
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-400">Laden...</p>
      ) : plans.length === 0 ? (
        <p className="text-gray-400 bg-white rounded-xl shadow-sm p-6">
          Keine Behandlungspläne vorhanden.
        </p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Titel</th>
                <th className="px-4 py-3 font-medium">Zahnarzt/-ärztin</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.map((p) => {
                const statusMeta = STATUS_LABELS[p.status] || STATUS_LABELS.planned
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/treatments/${p.id}`}
                        className="text-primary-700 font-medium hover:underline"
                      >
                        {p.patients?.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.title}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.user_profiles?.full_name ? `Dr. ${p.user_profiles.full_name}` : '—'}
                    </td>
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
