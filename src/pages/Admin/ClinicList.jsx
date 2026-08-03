import { useEffect, useState } from 'react'
import { Plus, Building2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from '../../lib/toast'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import FormField from '../../components/ui/FormField'
import Input from '../../components/ui/Input'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { SkeletonTable } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

const EMPTY_FORM = { name: '', address: '', phone: '', email: '' }

export default function ClinicList() {
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadClinics()
  }, [])

  async function loadClinics() {
    setLoading(true)
    const { data, error } = await supabase.from('clinics').select('*').order('created_at')
    if (error) {
      toast.error('Fehler beim Laden: ' + error.message)
    } else {
      setClinics(data)
    }
    setLoading(false)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')

    if (!form.name) {
      setError('Bitte Name der Klinik angeben.')
      return
    }

    setSaving(true)
    const { error } = await supabase.from('clinics').insert(form)
    setSaving(false)

    if (error) {
      setError('Fehler beim Speichern: ' + error.message)
    } else {
      toast.success('Klinik angelegt.')
      setForm(EMPTY_FORM)
      setModalOpen(false)
      loadClinics()
    }
  }

  async function toggleActive(clinic) {
    const { error } = await supabase
      .from('clinics')
      .update({ is_active: !clinic.is_active })
      .eq('id', clinic.id)

    if (error) {
      toast.error('Fehler beim Aktualisieren: ' + error.message)
    } else {
      setClinics((list) =>
        list.map((c) => (c.id === clinic.id ? { ...c, is_active: !c.is_active } : c))
      )
    }
  }

  return (
    <div>
      <PageHeader
        title="Kliniken"
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Neue Klinik
          </Button>
        }
      />

      {loading ? (
        <SkeletonTable rows={4} cols={4} />
      ) : clinics.length === 0 ? (
        <EmptyState icon={Building2} title="Keine Kliniken vorhanden" />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Adresse</TH>
              <TH>Kontakt</TH>
              <TH>Status</TH>
            </tr>
          </THead>
          <TBody>
            {clinics.map((c) => (
              <TR key={c.id}>
                <TD className="text-gray-800 font-medium">{c.name}</TD>
                <TD>{c.address || '—'}</TD>
                <TD>{c.phone || c.email || '—'}</TD>
                <TD>
                  <button onClick={() => toggleActive(c)}>
                    <Badge tone={c.is_active ? 'success' : 'neutral'}>
                      {c.is_active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Neue Klinik">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Name" htmlFor="clinic_name" required>
            <Input id="clinic_name" name="name" value={form.name} onChange={handleChange} />
          </FormField>
          <FormField label="Adresse" htmlFor="clinic_address">
            <Input id="clinic_address" name="address" value={form.address} onChange={handleChange} />
          </FormField>
          <FormField label="Telefon" htmlFor="clinic_phone">
            <Input id="clinic_phone" name="phone" value={form.phone} onChange={handleChange} />
          </FormField>
          <FormField label="E-Mail" htmlFor="clinic_email">
            <Input id="clinic_email" name="email" value={form.email} onChange={handleChange} />
          </FormField>

          {error && <p className="text-danger-600 text-sm">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" loading={saving}>
              Anlegen
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
