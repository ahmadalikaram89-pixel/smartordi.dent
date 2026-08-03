export default function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-gray-500">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-gray-300" />}
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  )
}
