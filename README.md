# CrepettooPOS — نظام نقاط بيع مطعم

نظام نقاط بيع وإدارة مطعم متكامل، يعمل offline على جهاز واحد مع دعم الطابعات الحرارية.

## الميزات الرئيسية

- **نقاط البيع (POS)** — واجهة سريعة لتسجيل الطلبات مع سحب وإفلات
- **إدارة القائمة** — أصناف ثلاثية اللغات (عربي/فرنسي/إنجليزي)
- **إدارة الطاولات** — تتبع حالة الطاولات (متاح/محجوز/احتياطي)
- **المبيعات** — تقارير يومية وأسبوعية وشهرية مع تصدير Excel/PDF
- **المطبخ** — طباعة إيصال المطبخ مع الأصناف والملاحظات
- **المصروفات** — تسجيل مشتريات و مصروفات المطعم
- **الإعدادات** — تخصيص اسم المطعم، الشعار، NIF/NIS/RC
- **النسخ الاحتياطي** — تصدير واستعادة + نسخ احتياطي تلقائي يومي
- **مستخدمون** — أدوار (مدير/كاشير) مع تغيير كلمة المرور

## التكنولوجيا

| المكون | التقنية |
|--------|---------|
| Frontend | React 18 + TypeScript + Vite + Zustand |
| Backend | Express.js + Prisma ORM |
| قاعدة البيانات | SQLite |
| سطح المكتب | Electron |
| الطباعة | HTML thermal receipt (80mm/58mm) |

## التشغيل أثناء التطوير

```bash
npm install
npx prisma generate
npm run dev
```

يفتح على `http://localhost:5173`

## البناء للإنتاج

```bash
# بناء السيرفر
npm run build:server

# بناء الواجهة
npm run build

# إنشاء مثبت Windows
npm run dist:win
```

## بناء المثبت

يتطلب:
- Node.js 18+
- Windows (لبناء .exe)

```bash
npm run dist:win
```

يُنشئ مجلد `release/` يحتوي على:
- `CrepettooPOS Setup.exe` — مثبت NSIS
- جميع الملفات المطلوبة للتشغيل

## أول تشغيل

1. شغّل التطبيق
2. سجل الدخول بـ `admin` / `admin123`
3. سيطلب منك تغيير كلمة المرور
4. اذهب إلى **الإعدادات** وأدخل معلومات المطعم:
   - اسم المطعم (عربي + لاتيني)
   - العنوان ورقم الهاتف
   - NIF / NIS / RC / NFL (رقم التعريف الجبائي)
5. ابدأ بإضافة أصناف القائمة

## هيكل المشروع

```
Crepettopos/
├── src/                    # واجهة React
│   ├── components/         # مكونات مشتركة
│   ├── pages/              # صفحات التطبيق
│   ├── stores/             # Zustand stores
│   ├── hooks/              # Custom hooks (طباعة، إلخ)
│   ├── i18n/               # الترجمات (AR/FR/EN)
│   └── types/              # أنواع TypeScript
├── server/                 # Express backend
│   ├── routes/             # مسارات API
│   ├── auth.ts             # مصادقة JWT
│   ├── db.ts               # Prisma singleton
│   ├── bootstrap.ts        # أول تشغيل
│   └── backup-scheduler.ts # نسخ احتياطي تلقائي
├── electron/               # Electron main process
├── prisma/                 # مخطط قاعدة البيانات
└── scripts/                # سكريبتات مساعدة
```

## API Endpoints

| Method | Endpoint | Auth | الوصف |
|--------|----------|------|-------|
| POST | /api/auth/login | — | تسجيل الدخول |
| GET | /api/menu/categories | — | قائمة التصنيفات |
| GET | /api/menu/items | — | قائمة الأصناف |
| POST | /api/orders | ✓ | إنشاء طلب |
| POST | /api/orders/:id/pay | ✓ | دفع طلب |
| POST | /api/orders/:id/refund | Manager | استرداد طلب |
| GET | /api/stats/dashboard | ✓ | لوحة التحكم |
| GET | /api/stats/daily-report | ✓ | تقرير يومي |
| POST | /api/stats/close-day | Manager | إغلاق اليوم |
| GET | /api/settings | ✓ | الإعدادات |
| PUT | /api/settings | Admin | تحديث الإعدادات |

## ملاحظات تقنية

- قاعدة البيانات: SQLite (ملف واحد — `crepettoo.db`)
- في وضع التطوير: `prisma/dev.db`
- في وضع الإنتاج: `%ProgramData%/CrepettooPOS/crepettoo.db`
- كلمة المرور الافتراضية: `admin123` (يجب تغييرها عند أول تشغيل)
- النسخ الاحتياطي التلقائي: يومياً منتصف الليل

## الترخيص

proprietary — Crepettoo © 2026
