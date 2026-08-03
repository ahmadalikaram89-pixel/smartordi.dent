# Smartordi.dent

نظام إدارة عيادات أسنان (Multi-Clinic / Multi-Tenant) مبني لسوق النمسا/الاتحاد الأوروبي.

## الستاك التقني

- **Frontend:** React (Vite) + TailwindCSS + React Router
- **Backend:** Supabase (PostgreSQL + Row Level Security)
- **Auth:** Supabase Auth
- **اللغة:** واجهة المستخدم بالألماني (Deutsch)

## الوحدات (Modules)

- إدارة مواعيد (حجز، تعديل، إلغاء، تنبيه تعارض)
- ملفات مرضى
- تشارت أسنان (Dental Chart)
- خطط علاجية
- فوترة ومحاسبة + طباعة/PDF
- لوحة تقارير وإحصائيات
- إدارة عيادات ومستخدمين (Admin) — تسجيل ذاتي + تبني من قبل الإدارة
- تطبيق سطح مكتب (Electron) بالإضافة للنسخة على الويب

## هيكلية المشروع

```
src/
  ├─ lib/supabase.js          # Supabase client
  ├─ lib/toast.js             # نظام التنبيهات (toast)
  ├─ contexts/AuthContext.jsx # حالة تسجيل الدخول + الدور (role) + clinic_id
  ├─ components/ui/           # نظام التصميم المشترك (Button, Card, Table, Modal...)
  ├─ components/RequireRole.jsx / PrintDocument.jsx
  ├─ layouts/DashboardLayout.jsx
  ├─ pages/
  │   ├─ Login.jsx / Signup.jsx / Dashboard.jsx
  │   ├─ Patients/            # PatientList, PatientForm, PatientProfile, DentalChart, PatientPrint
  │   ├─ Appointments/        # AppointmentCalendar, AppointmentForm
  │   ├─ Treatments/          # TreatmentList, TreatmentPlanForm, TreatmentPlanDetail
  │   ├─ Billing/             # InvoiceList, InvoiceForm, InvoiceDetail, InvoicePrint
  │   ├─ Admin/                # ClinicList, TeamList (super_admin / clinic_owner)
  │   └─ Reports/              # ReportsDashboard
  └─ App.jsx                  # Routing
electron/                     # واجهة تطبيق سطح المكتب (main.js, preload.cjs)
```

## قاعدة البيانات

ملف `schema.sql` يحتوي على:
- `clinics`, `user_profiles`, `patients`, `appointments`
- `dental_charts`, `treatment_plans`, `treatment_items`
- `invoices`, `payments`
- سياسات RLS تعزل بيانات كل عيادة عن الثانية (Multi-tenant isolation)

`schema_updates_admin.sql` (ترحيل إضافي، يشتغل بعد `schema.sql`):
- عمود `email` على `user_profiles` + trigger تلقائي عند التسجيل بـ `/signup`
- سياسات RLS لوحدة Admin (تبني مستخدمين معلّقين، إدارة عيادات)

## خطوات التشغيل

1. `npm install`
2. انسخ `.env.example` إلى `.env` وحط بيانات مشروع Supabase تبعك:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
3. شغّل `schema.sql` ثم `schema_updates_admin.sql` على Supabase (SQL Editor) — بالترتيب
4. `npm run dev`

## تطبيق سطح المكتب (Electron)

- `npm run electron:dev` — وضع التطوير (يشغّل Vite + Electron مع بعض)
- `npm run electron:build` — بناء نسخة قابلة للتثبيت (Windows/Mac/Linux) داخل مجلد `release/`
- بناء نسخ Windows (.exe) وMac (.dmg) موقعة تلقائياً بيصير عبر GitHub Actions (`.github/workflows/release.yml`) عند رفع tag بصيغة `v*` — لازم تضيف `VITE_SUPABASE_URL` و`VITE_SUPABASE_ANON_KEY` كـ Repository Secrets

## ملاحظات مهمة (GDPR / بيانات صحية)

- بيانات المرضى الصحية مصنّفة "Special Category Data" بموجب GDPR — لازم Supabase project يكون بمنطقة EU (فرانكفورت)
- لازم consent واضح عند تسجيل كل مريض (`consent_given`, `consent_date` موجودين بالجدول)
- يُفضّل مراجعة قانونية محلية بالنمسا قبل الإطلاق الفعلي (GDPR officer / محامي مختص)

## الحالة الحالية

راجعي `TODO.md` لمعرفة الخطوات القادمة.
