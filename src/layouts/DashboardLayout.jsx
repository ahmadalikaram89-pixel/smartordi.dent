import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  Receipt,
  BarChart3,
  Building2,
  UserCog,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Übersicht', icon: LayoutDashboard },
  { to: '/patients', label: 'Patienten', icon: Users },
  { to: '/appointments', label: 'Termine', icon: CalendarDays },
  { to: '/treatments', label: 'Behandlungspläne', icon: Stethoscope },
  { to: '/billing', label: 'Abrechnung', icon: Receipt },
  { to: '/reports', label: 'Berichte', icon: BarChart3 },
]

export default function DashboardLayout() {
  const { profile, role, signOut } = useAuth()

  const adminItems = [
    role === 'super_admin' && { to: '/admin/clinics', label: 'Kliniken', icon: Building2 },
    (role === 'super_admin' || role === 'clinic_owner') && {
      to: '/admin/team',
      label: 'Team',
      icon: UserCog,
    },
  ].filter(Boolean)

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-primary-700">Smartordi.dent</h2>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}

          {adminItems.length > 0 && (
            <>
              <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Verwaltung
              </p>
              {adminItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-600 truncate">{profile?.full_name}</p>
          <p className="text-[11px] text-gray-400 mb-2 capitalize">{role?.replace('_', ' ')}</p>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-sm text-danger-600 hover:underline"
          >
            <LogOut className="h-3.5 w-3.5" />
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
