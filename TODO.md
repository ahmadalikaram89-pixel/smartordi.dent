# TODO — Smartordi.dent

## ✅ تم إنجازه

- [x] تصميم schema قاعدة البيانات (multi-tenant) + RLS
- [x] هيكلية مشروع React/Vite + Tailwind
- [x] Supabase client (`lib/supabase.js`)
- [x] AuthContext (تسجيل دخول، جلب role + clinic_id)
- [x] صفحة تسجيل الدخول (Login.jsx)
- [x] DashboardLayout + Routing محمي

## 🔲 القادم (بالترتيب المنطقي)

### 1. وحدة المرضى (Patients) — الأساس ✅
- [x] صفحة قائمة المرضى (`PatientList.jsx`) — مع بحث
- [x] نموذج إضافة/تعديل مريض (`PatientForm.jsx`) — مع حقل الموافقة consent إجباري
- [x] صفحة ملف المريض (`PatientProfile.jsx`) — بيانات + آخر مواعيد
- [x] تشارت الأسنان التفاعلي (`DentalChart.jsx`) — 32 سن، حالة كل سن بالألوان
- [ ] اختبار الوحدة كاملة بعد ربط Supabase فعلياً

### 2. وحدة المواعيد (Appointments) ✅ (أساسي)
- [x] عرض يومي للمواعيد (`AppointmentCalendar.jsx`) — تنقل بين الأيام
- [x] نموذج حجز موعد جديد (`AppointmentForm.jsx`) — مربوط بمريض + طبيب
- [ ] عرض أسبوعي/شهري (اختياري لاحقاً)
- [ ] تعديل/إلغاء موعد من نفس الصفحة (حالياً بس إنشاء)
- [ ] تنبيه تعارض مواعيد (نفس الطبيب بنفس الوقت)

### 3. وحدة الخطط العلاجية (Treatments)
- [ ] إنشاء خطة علاج لمريض
- [ ] إضافة بنود علاجية (tooth_number, procedure_name, cost)
- [ ] تتبع حالة كل بند (planned → in_progress → completed)

### 4. وحدة الفوترة (Billing)
- [ ] إنشاء فاتورة من خطة علاج
- [ ] تسجيل دفعات (payments)
- [ ] تقرير حالة الفواتير (مدفوعة / متأخرة)

### 5. إدارة العيادات والمستخدمين (Admin)
- [ ] صفحة لـ super_admin لإدارة العيادات (clinics)
- [ ] دعوة/إضافة مستخدمين جدد لعيادة معينة
- [ ] إدارة الأدوار (dentist / receptionist / clinic_owner)

### 6. الأمان والامتثال (Security & Compliance)
- [ ] اختبار سياسات RLS فعلياً (تأكيد إن عيادة ما بتشوف بيانات عيادة تانية)
- [ ] تشفير الحقول الحساسة (medical_history) — تقييم pgcrypto أو Supabase Vault
- [ ] Audit log لعمليات تعديل/حذف سجلات المرضى
- [ ] مراجعة قانونية GDPR قبل الإطلاق

### 7. النشر (Deployment)
- [ ] رفع المشروع على GitHub
- [ ] اختيار منصة استضافة (Vercel / Netlify)
- [ ] إعداد Supabase project بمنطقة EU (فرانكفورت)
- [ ] بيئة staging منفصلة عن production

## 💡 أفكار مستقبلية (Backlog)

- تقارير وإحصائيات لأداء العيادة
- تذكير مواعيد عبر بريد إلكتروني (بدون واتساب حالياً)
- تصدير سجل المريض PDF
- دعم عيادات متعددة اللغات (ألماني/إنجليزي)
