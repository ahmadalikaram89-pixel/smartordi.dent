import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Upload, Trash2, X, FolderOpen, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import toast from '../../lib/toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonList } from '../../components/ui/Skeleton'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const CATEGORIES = {
  xray: { label: 'Röntgenbild', tone: 'info' },
  photo: { label: 'Foto', tone: 'success' },
  document: { label: 'Dokument', tone: 'warning' },
  other: { label: 'Sonstiges', tone: 'neutral' },
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic']

function isImageFile(fileName) {
  const lower = fileName.toLowerCase()
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15 MB

export default function PatientImages() {
  const { id } = useParams()
  const { clinicId, user } = useAuth()
  const [patient, setPatient] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('xray')
  const [uploading, setUploading] = useState(false)
  const [lightboxImage, setLightboxImage] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (clinicId) loadData()
  }, [clinicId, id])

  async function loadData() {
    setLoading(true)

    const [patientRes, filesRes] = await Promise.all([
      supabase.from('patients').select('full_name').eq('id', id).single(),
      supabase
        .from('patient_images')
        .select('*')
        .eq('patient_id', id)
        .order('uploaded_at', { ascending: false }),
    ])

    if (patientRes.error) {
      toast.error('Fehler beim Laden des Patienten: ' + patientRes.error.message)
    } else {
      setPatient(patientRes.data)
    }

    if (filesRes.error) {
      toast.error('Fehler beim Laden der Dateien: ' + filesRes.error.message)
      setLoading(false)
      return
    }

    const withUrls = await Promise.all(
      (filesRes.data ?? []).map(async (file) => {
        const { data: signed } = await supabase.storage
          .from('patient-images')
          .createSignedUrl(file.storage_path, 3600)
        return { ...file, url: signed?.signedUrl }
      })
    )

    setImages(withUrls)
    setLoading(false)
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Datei zu groß (max. 15 MB).')
      return
    }

    setUploading(true)

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${clinicId}/${id}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('patient-images')
      .upload(storagePath, file)

    if (uploadError) {
      setUploading(false)
      toast.error('Fehler beim Hochladen: ' + uploadError.message)
      return
    }

    const { data, error: insertError } = await supabase
      .from('patient_images')
      .insert({
        clinic_id: clinicId,
        patient_id: id,
        storage_path: storagePath,
        file_name: file.name,
        category,
        uploaded_by: user.id,
      })
      .select()
      .single()

    setUploading(false)

    if (insertError) {
      toast.error('Fehler beim Speichern: ' + insertError.message)
      return
    }

    const { data: signed } = await supabase.storage
      .from('patient-images')
      .createSignedUrl(storagePath, 3600)

    setImages((list) => [{ ...data, url: signed?.signedUrl }, ...list])
    toast.success('Datei hochgeladen.')
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)

    await supabase.storage.from('patient-images').remove([deleteTarget.storage_path])
    const { error } = await supabase.from('patient_images').delete().eq('id', deleteTarget.id)

    setDeleting(false)

    if (error) {
      toast.error('Fehler beim Löschen: ' + error.message)
    } else {
      setImages((list) => list.filter((img) => img.id !== deleteTarget.id))
      toast.success('Datei gelöscht.')
      setDeleteTarget(null)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dateien</h1>
          {patient && <p className="text-sm text-gray-500 mt-0.5">{patient.full_name}</p>}
        </div>
        <Link
          to={`/patients/${id}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Zurück zum Patienten
        </Link>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">Datei hochladen</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Kategorie</label>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-auto">
              {Object.entries(CATEGORIES).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </div>

          <label>
            <span className="sr-only">Datei wählen</span>
            <Button as="span" loading={uploading} className="cursor-pointer">
              <Upload className="h-4 w-4" />
              {uploading ? 'Hochladen...' : 'Datei auswählen'}
            </Button>
            <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
          </label>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Bilder, PDF, Word/Excel-Dokumente u.a., max. 15 MB.
        </p>
      </Card>

      {loading ? (
        <SkeletonList rows={2} />
      ) : images.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Noch keine Dateien vorhanden" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((img) => {
            const meta = CATEGORIES[img.category] || CATEGORIES.other
            const isImage = isImageFile(img.file_name)
            return (
              <div key={img.id} className="group relative">
                <button
                  onClick={() => (isImage ? setLightboxImage(img) : window.open(img.url, '_blank'))}
                  className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center hover:opacity-90 transition"
                >
                  {isImage && img.url ? (
                    <img src={img.url} alt={img.file_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 px-2">
                      <FileText className="h-8 w-8 text-gray-400" />
                      <span className="text-[11px] text-gray-400 truncate max-w-full">
                        {img.file_name}
                      </span>
                    </div>
                  )}
                </button>
                <div className="flex items-center justify-between mt-1.5">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <button
                    onClick={() => setDeleteTarget(img)}
                    className="p-1 text-gray-300 hover:text-danger-600 opacity-0 group-hover:opacity-100 transition"
                    aria-label="Löschen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6 animate-in fade-in duration-150"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            aria-label="Schließen"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxImage.url}
            alt={lightboxImage.file_name}
            className="max-w-full max-h-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Datei löschen?"
        description={deleteTarget ? `"${deleteTarget.file_name}" wird endgültig gelöscht.` : ''}
        confirmLabel="Löschen"
        confirmVariant="danger"
      />
    </div>
  )
}
