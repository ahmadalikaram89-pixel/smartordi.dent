import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Users, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { SkeletonTable } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

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
    setError('')
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
      <PageHeader
        title="Patienten"
        action={
          <Button as={Link} to="/patients/new">
            <Plus className="h-4 w-4" />
            Neuer Patient
          </Button>
        }
      />

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Patient suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={3} />
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          tone="danger"
          title="Patienten konnten nicht geladen werden"
          description={error}
          action={
            <Button variant="secondary" onClick={loadPatients}>
              Erneut versuchen
            </Button>
          }
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Telefon</TH>
              <TH>Geburtsdatum</TH>
            </tr>
          </THead>
          <TBody>
            {filtered.map((p) => (
              <TR key={p.id}>
                <TD>
                  <Link
                    to={`/patients/${p.id}`}
                    className="text-primary-700 font-medium hover:underline"
                  >
                    {p.full_name}
                  </Link>
                </TD>
                <TD>{p.phone || '—'}</TD>
                <TD>{p.date_of_birth || '—'}</TD>
              </TR>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10">
                  <div className="flex flex-col items-center text-gray-400">
                    <Users className="h-8 w-8 mb-2" />
                    <p>Keine Patienten gefunden.</p>
                  </div>
                </td>
              </tr>
            )}
          </TBody>
        </Table>
      )}
    </div>
  )
}
