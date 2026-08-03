# TODO — Smartordi.dent

## ✅ تم إنجازه

- [x] تصميم schema قاعدة البيانات (multi-tenant) + RLS
- [x] هيكلية مشروع React/Vite + Tailwind
- [x] Supabase client (`lib/supabase.js`)
- [x] AuthContext (تسجيل دخول، جلب role + clinic_id)
- [x] صفحة تسجيل الدخول (Login.jsx)
- [x] DashboardLayout + Routing محمي
- [x] تنظيم بنية المشروع داخل `src/` (كانت الملفات مبعثرة بجذر المشروع) + تصحيح أسماء ملفات الإعداد (`vite.config.js`, `tailwind.config.js`, `postcss.config.js`)

## 🔲 القادم (بالترتيب المنطقي)

### 1. وحدة المرضى (Patients) — الأساس ✅
- [x] صفحة قائمة المرضى (`PatientList.jsx`) — مع بحث
- [x] نموذج إضافة/تعديل مريض (`PatientForm.jsx`) — مع حقل الموافقة consent إجباري
- [x] صفحة ملف المريض (`PatientProfile.jsx`) — بيانات + آخر مواعيد
- [x] تشارت الأسنان التفاعلي (`DentalChart.jsx`) — 32 سن، حالة كل سن بالألوان
- [ ] اختبار الوحدة كاملة بعد ربط Supabase فعلياً

### 2. وحدة المواعيد (Appointments) ✅
- [x] عرض يومي للمواعيد (`AppointmentCalendar.jsx`) — تنقل بين الأيام
- [x] نموذج حجز موعد جديد (`AppointmentForm.jsx`) — مربوط بمريض + طبيب
- [x] تعديل/إلغاء موعد من نفس الصفحة
- [x] تنبيه تعارض مواعيد (نفس الطبيب بنفس الوقت) — فحص client-side، مش قيد قاعدة بيانات صارم
- [ ] عرض أسبوعي/شهري (اختياري لاحقاً)

### 3. وحدة الخطط العلاجية (Treatments) ✅ (أساسي)
- [x] إنشاء خطة علاج لمريض (`TreatmentPlanForm.jsx`)
- [x] إضافة بنود علاجية (tooth_number, procedure_name, cost) (`TreatmentPlanDetail.jsx`)
- [x] تتبع حالة كل بند (planned → in_progress → completed)

### 4. وحدة الفوترة (Billing) ✅ (أساسي)
- [x] إنشاء فاتورة (اختياري: تعبئة المبلغ تلقائياً من خطة علاج) (`InvoiceForm.jsx`)
- [x] تسجيل دفعات (payments) (`InvoiceDetail.jsx`)
- [x] فلترة حالة الفواتير (الكل / مدفوعة / متأخرة) (`InvoiceList.jsx`)

### 5. إدارة العيادات والمستخدمين (Admin) ✅
- [x] صفحة لـ super_admin لإدارة العيادات (`Admin/ClinicList.jsx`)
- [x] تسجيل ذاتي (`/signup`) + تبني المستخدمين المعلّقين وربطهم بعيادة (`Admin/TeamList.jsx`)
- [x] إدارة الأدوار (dentist / receptionist / clinic_owner)
- [ ] **يجب تشغيل `schema_updates_admin.sql` يدوياً على مشروع Supabase الحي** (لازم قبل ما تشتغل هاي الوحدة)
- [ ] ترقية أول `super_admin` يدوياً بعد أول تسجيل (SQL)

### 6. الأمان والامتثال (Security & Compliance)
- [x] سياسات RLS لوحدة Admin مع `with check` صارمة (تمنع تصعيد صلاحيات أو الوصول لعيادة تانية)
- [ ] اختبار سياسات RLS فعلياً على مشروع حي (تأكيد إن عيادة ما بتشوف بيانات عيادة تانية)
- [ ] تشفير الحقول الحساسة (medical_history) — تقييم pgcrypto أو Supabase Vault
- [ ] Audit log لعمليات تعديل/حذف سجلات المرضى
- [ ] مراجعة قانونية GDPR قبل الإطلاق

### 7. النشر (Deployment) ✅
- [x] رفع المشروع على GitHub
- [x] استضافة على Vercel + Supabase (EU)
- [x] تطبيق سطح مكتب عبر Electron (`electron:dev` / `electron:build`) + GitHub Actions لبناء exe/dmg/AppImage تلقائياً
- [ ] بيئة staging منفصلة عن production

### 8. تقارير وطباعة ✅
- [x] لوحة تقارير وإحصائيات (`/reports`) — مرضى جدد، مواعيد، إيرادات، حالة خطط علاجية
- [x] طباعة/PDF للفواتير وملف المريض (`/billing/:id/print`, `/patients/:id/print`)

## 💡 أفكار مستقبلية (Backlog)

- تذكير مواعيد عبر بريد إلكتروني (بدون واتساب حالياً)
- دعم عيادات متعددة اللغات (ألماني/إنجليزي)
- قيد قاعدة بيانات صارم لمنع تعارض المواعيد (`EXCLUDE` constraint) بدل الفحص client-side فقط
- شهادات توقيع لتطبيق سطح المكتب (Windows EV cert / Apple Developer) لتجنب تحذيرات SmartScreen/Gatekeeper
