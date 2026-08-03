# Smartordi.dent

نظام إدارة عيادات أسنان (Multi-Clinic / Multi-Tenant) مبني لسوق النمسا/الاتحاد الأوروبي.

## الستاك التقني

- **Frontend:** React (Vite) + TailwindCSS + React Router
- **Backend:** Supabase (PostgreSQL + Row Level Security)
- **Auth:** Supabase Auth
- **اللغة:** واجهة المستخدم بالألماني (Deutsch)

## الوحدات (Modules)

- إدارة مواعيد
- ملفات مرضى
- تشارت أسنان (Dental Chart)
- خطط علاجية
- فوترة ومحاسبة

## هيكلية المشروع

```
src/
  ├─ lib/supabase.js          # Supabase client
  ├─ contexts/AuthContext.jsx # حالة تسجيل الدخول + الدور (role) + clinic_id
  ├─ layouts/DashboardLayout.jsx
  ├─ pages/
  │   ├─ Login.jsx
  │   ├─ Dashboard.jsx
  │   ├─ Patients/            # PatientList, PatientForm, PatientProfile, DentalChart
  │   ├─ Appointments/        # AppointmentCalendar, AppointmentForm
  │   ├─ Treatments/          # TreatmentList, TreatmentPlanForm, TreatmentPlanDetail
  │   └─ Billing/             # InvoiceList, InvoiceForm, InvoiceDetail
  └─ App.jsx                  # Routing
```

## قاعدة البيانات

ملف `schema.sql` يحتوي على:
- `clinics`, `user_profiles`, `patients`, `appointments`
- `dental_charts`, `treatment_plans`, `treatment_items`
- `invoices`, `payments`
- سياسات RLS تعزل بيانات كل عيادة عن الثانية (Multi-tenant isolation)

## خطوات التشغيل

1. `npm install`
2. انسخ `.env.example` إلى `.env` وحط بيانات مشروع Supabase تبعك:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
3. شغّلي `schema.sql` على Supabase (SQL Editor)
4. `npm run dev`

## ملاحظات مهمة (GDPR / بيانات صحية)

- بيانات المرضى الصحية مصنّفة "Special Category Data" بموجب GDPR — لازم Supabase project يكون بمنطقة EU (فرانكفورت)
- لازم consent واضح عند تسجيل كل مريض (`consent_given`, `consent_date` موجودين بالجدول)
- يُفضّل مراجعة قانونية محلية بالنمسا قبل الإطلاق الفعلي (GDPR officer / محامي مختص)

## الحالة الحالية

راجعي `TODO.md` لمعرفة الخطوات القادمة.
