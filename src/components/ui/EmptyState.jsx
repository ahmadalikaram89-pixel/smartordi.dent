export default function EmptyState({ icon: Icon, title, description, action, tone = 'neutral' }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-10 text-center">
      {Icon && (
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
            tone === 'danger' ? 'bg-danger-50 text-danger-600' : 'bg-gray-100 text-gray-400'
          }`}
        >
          <Icon className="h-6 w-6" />
        </div>
      )}
      <p className="font-medium text-gray-700">{title}</p>
      {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
