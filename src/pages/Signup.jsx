import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Stethoscope, MailCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Card from '../components/ui/Card'
import FormField from '../components/ui/FormField'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function Signup() {
  const { user } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    setLoading(false)

    if (error) {
      setError('Registrierung fehlgeschlagen: ' + error.message)
    } else if (!data.session) {
      setAwaitingConfirmation(true)
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-sm p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-info-50 text-info-600">
            <MailCheck className="h-6 w-6" />
          </div>
          <p className="font-medium text-gray-800 mb-1">Bitte bestätige deine E-Mail</p>
          <p className="text-sm text-gray-500">
            Wir haben dir einen Bestätigungslink an {email} gesendet. Danach kann dich die Klinikleitung
            deinem Team zuweisen.
          </p>
        </Card>
      </div>
    )
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
            <FormField label="Vollständiger Name" htmlFor="full_name" required>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </FormField>

            <FormField label="E-Mail" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </FormField>

            <FormField label="Passwort" htmlFor="password" required>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </FormField>

            {error && <p className="text-danger-600 text-sm">{error}</p>}

            <p className="text-xs text-gray-500">
              Nach der Registrierung musst du von deiner Klinikleitung einem Team zugewiesen werden,
              bevor du dich anmelden kannst.
            </p>

            <Button type="submit" loading={loading} className="w-full">
              {loading ? 'Registrieren...' : 'Registrieren'}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-4">
          Schon registriert?{' '}
          <Link to="/login" className="text-primary-700 font-medium hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  )
}
