import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function PatientList() {
  const { clinicId } = useAuth()
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (clinicId) loadPatients()
  }, [clinicId])

  async function loadPatients() {
    setLoading(true)
    const { data, error } = await supabase
      .from('patients')
      .select('id, full_name, phone, date_of_birth')
      .eq('clinic_id', clinicId)
      .order('full_name', { ascending: true })

    if (error) {
      setError('Fehler beim Laden der Patienten: ' + error.message)
    } else {
      setPatients(data)
    }
    setLoading(false)
  }

  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Patienten</h1>
        <Link
          to="/patients/new"
          className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Neuer Patient
        </Link>
      </div>

      <input
        type="text"
        placeholder="Patient suchen..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm mb-4 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-400">Laden...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Telefon</th>
                <th className="px-4 py-3 font-medium">Geburtsdatum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/patients/${p.id}`}
                      className="text-primary-700 font-medium hover:underline"
                    >
                      {p.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.date_of_birth || '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                    Keine Patienten gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
