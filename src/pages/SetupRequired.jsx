export default function SetupRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md bg-white rounded-xl shadow-sm p-8 text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-3">Supabase ist nicht konfiguriert</h1>
        <p className="text-gray-600 text-sm mb-4">
          Die Umgebungsvariablen <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_URL</code>{' '}
          und <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> fehlen.
        </p>
        <p className="text-gray-500 text-sm" dir="rtl">
          لازم تضيف بيانات مشروع Supabase الحقيقي (VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY) بإعدادات
          البيئة (Environment Variables) — إما بملف <code dir="ltr">.env</code> محلياً، أو بإعدادات
          المشروع على Vercel، وبعدها أعد النشر.
        </p>
      </div>
    </div>
  )
}
