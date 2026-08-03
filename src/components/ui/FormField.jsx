export default function FormField({ label, htmlFor, error, required, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-danger-600">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-danger-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
