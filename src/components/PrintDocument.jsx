import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Printer, ArrowLeft } from 'lucide-react'
import Button from './ui/Button'

export default function PrintDocument({
  backTo,
  clinicName,
  documentTitle,
  children,
  autoPrint = true,
}) {
  useEffect(() => {
    if (!autoPrint) return
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [autoPrint])

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="no-print flex items-center justify-between max-w-2xl mx-auto px-6 pt-6">
        <Link to={backTo} className="flex items-center gap-1 text-sm text-gray-500 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          Zurück
        </Link>
        <Button onClick={() => window.print()} size="sm">
          <Printer className="h-4 w-4" />
          Drucken
        </Button>
      </div>

      <div className="max-w-2xl mx-auto bg-white shadow-card print:shadow-none rounded-xl print:rounded-none my-6 p-10">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
          <div>
            <p className="text-lg font-bold text-primary-700">{clinicName || 'Smartordi.dent'}</p>
            <p className="text-sm text-gray-500">{documentTitle}</p>
          </div>
          <p className="text-sm text-gray-400">{new Date().toLocaleDateString('de-AT')}</p>
        </div>

        {children}
      </div>
    </div>
  )
}
