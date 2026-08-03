import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight, Pencil, X, CalendarX2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import toast from '../../lib/toast'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonList } from '../../components/ui/Skeleton'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const STATUS_LABELS = {
  scheduled: { label: 'Geplant', tone: 'info' },
  confirmed: { label: 'Bestätigt', tone: 'success' },
  completed: { label: 'Abgeschlossen', tone: 'neutral' },
  cancelled: { label: 'Storniert', tone: 'danger' },
  no_show: { label: 'Nicht erschienen', tone: 'warning' },
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export default function AppointmentCalendar() {
  const { clinicId } = useAuth()
  const [day, setDay] = useState(startOfDay(new Date()))
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (clinicId) loadAppointments()
  }, [clinicId, day])

  async function loadAppointments() {
    setLoading(true)
    const dayEnd = addDays(day, 1)

    const { data, error } = await supabase
      .from('appointments')
      .select('id, start_time, end_time, status, notes, patients(full_name), user_profiles(full_name)')
      .eq('clinic_id', clinicId)
      .gte('start_time', day.toISOString())
      .lt('start_time', dayEnd.toISOString())
      .order('start_time', { ascending: true })

    if (!error) setAppointments(data)
    setLoading(false)
  }

  async function handleCancel() {
    if (!cancelTarget) return
    setCancelling(true)
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', cancelTarget.id)

    setCancelling(false)

    if (error) {
      toast.error('Fehler beim Stornieren: ' + error.message)
    } else {
      toast.success('Termin storniert.')
      setAppointments((list) =>
        list.map((a) => (a.id === cancelTarget.id ? { ...a, status: 'cancelled' } : a))
      )
      setCancelTarget(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Termine"
        action={
          <Button as={Link} to="/appointments/new">
            <Plus className="h-4 w-4" />
            Neuer Termin
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <Button variant="secondary" size="sm" onClick={() => setDay(addDays(day, -1))}>
          <ChevronLeft className="h-4 w-4" />
          Vorheriger Tag
        </Button>
        <span className="font-medium text-gray-700">
          {day.toLocaleDateString('de-AT', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
        <Button variant="secondary" size="sm" onClick={() => setDay(addDays(day, 1))}>
          Nächster Tag
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDay(startOfDay(new Date()))}>
          Heute
        </Button>
      </div>

      {loading ? (
        <SkeletonList rows={4} />
      ) : appointments.length === 0 ? (
        <EmptyState icon={CalendarX2} title="Keine Termine an diesem Tag" />
      ) : (
        <Card className="divide-y divide-gray-100">
          {appointments.map((a) => {
            const statusMeta = STATUS_LABELS[a.status] || STATUS_LABELS.scheduled
            const isCancellable = a.status !== 'cancelled' && a.status !== 'completed'
            return (
              <div key={a.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-gray-800">
                    {new Date(a.start_time).toLocaleTimeString('de-AT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    –{' '}
                    {new Date(a.end_time).toLocaleTimeString('de-AT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {a.patients?.full_name} · Dr. {a.user_profiles?.full_name}
                  </p>
                  {a.notes && <p className="text-xs text-gray-400 mt-1">{a.notes}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                  {isCancellable && (
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/appointments/${a.id}/edit`}
                        className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-50"
                        aria-label="Bearbeiten"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => setCancelTarget(a)}
                        className="p-1.5 text-gray-400 hover:text-danger-600 rounded-lg hover:bg-gray-50"
                        aria-label="Stornieren"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        loading={cancelling}
        title="Termin stornieren?"
        description={
          cancelTarget
            ? `Der Termin mit ${cancelTarget.patients?.full_name} wird storniert.`
            : ''
        }
        confirmLabel="Stornieren"
        confirmVariant="danger"
      />
    </div>
  )
}
