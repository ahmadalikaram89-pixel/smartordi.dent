import { useEffect, useState } from 'react'
import { UserCog, UserPlus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import toast from '../../lib/toast'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import FormField from '../../components/ui/FormField'
import { SkeletonList } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

const ROLE_LABELS = {
  clinic_owner: 'Klinikleitung',
  dentist: 'Zahnarzt/-ärztin',
  receptionist: 'Rezeption',
}

const ASSIGNABLE_ROLES = ['dentist', 'receptionist', 'clinic_owner']

export default function TeamList() {
  const { role, clinicId, user } = useAuth()
  const isSuperAdmin = role === 'super_admin'

  const [pending, setPending] = useState([])
  const [team, setTeam] = useState([])
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [claimTarget, setClaimTarget] = useState(null)
  const [claimForm, setClaimForm] = useState({ role: 'dentist', clinic_id: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [role, clinicId])

  async function loadData() {
    setLoading(true)

    const queries = [supabase.from('user_profiles').select('*').is('clinic_id', null)]

    if (isSuperAdmin) {
      queries.push(supabase.from('clinics').select('id, name').order('name'))
    } else if (clinicId) {
      queries.push(supabase.from('user_profiles').select('*').eq('clinic_id', clinicId))
    }

    const results = await Promise.all(queries)
    const pendingRes = results[0]

    if (!pendingRes.error) setPending(pendingRes.data)

    if (isSuperAdmin) {
      if (!results[1]?.error) setClinics(results[1].data)
    } else if (clinicId && !results[1]?.error) {
      setTeam(results[1].data)
    }

    setLoading(false)
  }

  function openClaimModal(target) {
    setClaimTarget(target)
    setClaimForm({ role: 'dentist', clinic_id: isSuperAdmin ? '' : clinicId })
  }

  async function handleClaim(e) {
    e.preventDefault()
    if (isSuperAdmin && !claimForm.clinic_id) {
      toast.error('Bitte Klinik auswählen.')
      return
    }

    setSaving(true)
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: claimForm.role, clinic_id: claimForm.clinic_id || clinicId })
      .eq('id', claimTarget.id)

    setSaving(false)

    if (error) {
      toast.error('Fehler beim Zuweisen: ' + error.message)
    } else {
      toast.success(`${claimTarget.full_name} wurde zugewiesen.`)
      setClaimTarget(null)
      loadData()
    }
  }

  async function updateTeamRole(memberId, newRole) {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', memberId)

    if (error) {
      toast.error('Fehler beim Aktualisieren: ' + error.message)
    } else {
      setTeam((list) => list.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)))
      toast.success('Rolle aktualisiert.')
    }
  }

  if (loading) return <SkeletonList rows={4} />

  return (
    <div>
      <PageHeader title="Team" />

      <h2 className="text-lg font-semibold text-gray-800 mb-3">Ausstehende Registrierungen</h2>
      {pending.length === 0 ? (
        <EmptyState icon={UserPlus} title="Keine ausstehenden Registrierungen" />
      ) : (
        <Card className="divide-y divide-gray-100 mb-8">
          {pending.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="font-medium text-gray-800">{p.full_name}</p>
                <p className="text-sm text-gray-500">{p.email}</p>
              </div>
              <Button size="sm" onClick={() => openClaimModal(p)}>
                Zuweisen
              </Button>
            </div>
          ))}
        </Card>
      )}

      {!isSuperAdmin && (
        <>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Team</h2>
          {team.length === 0 ? (
            <EmptyState icon={UserCog} title="Noch keine Teammitglieder" />
          ) : (
            <Card className="divide-y divide-gray-100">
              {team.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-medium text-gray-800">{m.full_name}</p>
                    <p className="text-sm text-gray-500">{m.email}</p>
                  </div>
                  {m.id === user.id ? (
                    <Badge tone="info">{ROLE_LABELS[m.role] || m.role} (Du)</Badge>
                  ) : (
                    <Select
                      value={m.role}
                      onChange={(e) => updateTeamRole(m.id, e.target.value)}
                      className="w-auto"
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </Select>
                  )}
                </div>
              ))}
            </Card>
          )}
        </>
      )}

      <Modal
        open={Boolean(claimTarget)}
        onClose={() => setClaimTarget(null)}
        title={`${claimTarget?.full_name || ''} zuweisen`}
      >
        <form onSubmit={handleClaim} className="space-y-4">
          {isSuperAdmin && (
            <FormField label="Klinik" htmlFor="claim_clinic" required>
              <Select
                id="claim_clinic"
                value={claimForm.clinic_id}
                onChange={(e) => setClaimForm((f) => ({ ...f, clinic_id: e.target.value }))}
              >
                <option value="">Bitte wählen...</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          <FormField label="Rolle" htmlFor="claim_role" required>
            <Select
              id="claim_role"
              value={claimForm.role}
              onChange={(e) => setClaimForm((f) => ({ ...f, role: e.target.value }))}
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setClaimTarget(null)}>
              Abbrechen
            </Button>
            <Button type="submit" loading={saving}>
              Zuweisen
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
