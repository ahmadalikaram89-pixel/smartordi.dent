import { useState } from 'react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import { Stethoscope } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Card from '../components/ui/Card'
import FormField from '../components/ui/FormField'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function Login() {
  const { user, signIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) {
    const redirectTo = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)

    setLoading(false)

    if (error) {
      setError('Anmeldung fehlgeschlagen: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-primary-600 flex items-center justify-center mb-3">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-primary-700">Smartordi.dent</h1>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="E-Mail" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </FormField>

            <FormField label="Passwort" htmlFor="password">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </FormField>

            {error && <p className="text-danger-600 text-sm">{error}</p>}

            <Button type="submit" loading={loading} className="w-full">
              {loading ? 'Anmelden...' : 'Anmelden'}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-4">
          Noch kein Konto?{' '}
          <Link to="/signup" className="text-primary-700 font-medium hover:underline">
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  )
}
