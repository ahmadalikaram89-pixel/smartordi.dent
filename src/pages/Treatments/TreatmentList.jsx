import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Stethoscope } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { SkeletonTable } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

const STATUS_LABELS = {
  planned: { label: 'Geplant', tone: 'info' },
  in_progress: { label: 'In Behandlung', tone: 'warning' },
  completed: { label: 'Abgeschlossen', tone: 'success' },
  cancelled: { label: 'Storniert', tone: 'danger' },
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
      <PageHeader
        title="Behandlungspläne"
        action={
          <Button as={Link} to="/treatments/new">
            <Plus className="h-4 w-4" />
            Neuer Behandlungsplan
          </Button>
        }
      />

      {loading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : plans.length === 0 ? (
        <EmptyState icon={Stethoscope} title="Keine Behandlungspläne vorhanden" />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Patient</TH>
              <TH>Titel</TH>
              <TH>Zahnarzt/-ärztin</TH>
              <TH>Status</TH>
            </tr>
          </THead>
          <TBody>
            {plans.map((p) => {
              const statusMeta = STATUS_LABELS[p.status] || STATUS_LABELS.planned
              return (
                <TR key={p.id}>
                  <TD>
                    <Link
                      to={`/treatments/${p.id}`}
                      className="text-primary-700 font-medium hover:underline"
                    >
                      {p.patients?.full_name}
                    </Link>
                  </TD>
                  <TD>{p.title}</TD>
                  <TD>{p.user_profiles?.full_name ? `Dr. ${p.user_profiles.full_name}` : '—'}</TD>
                  <TD>
                    <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                  </TD>
                </TR>
              )
            })}
          </TBody>
        </Table>
      )}
    </div>
  )
}
