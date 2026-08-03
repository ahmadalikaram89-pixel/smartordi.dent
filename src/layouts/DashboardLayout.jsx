import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Übersicht' },
  { to: '/patients', label: 'Patienten' },
  { to: '/appointments', label: 'Termine' },
  { to: '/treatments', label: 'Behandlungspläne' },
  { to: '/billing', label: 'Abrechnung' },
]

export default function DashboardLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-primary-700">Smartordi.dent</h2>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2">{profile?.full_name}</p>
          <button
            onClick={signOut}
            className="text-sm text-red-600 hover:underline"
          >
            Abmelden
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}
