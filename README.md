<!-- CAT-COUNTER:START -->
<p align="center">
  <img src="https://count.himiku.com/@chunma-lnreader-arabic-plugins?theme=capoo-2&amp;padding=6&amp;scale=0.8&amp;darkmode=1" alt="Cat visits counter" />
</p>
<!-- CAT-COUNTER:END -->

# إضافات LNReader العربية

[![بناء الإضافات](https://github.com/chunma-san/lnreader-arabic-plugins/actions/workflows/publish-plugins.yml/badge.svg)](https://github.com/chunma-san/lnreader-arabic-plugins/actions/workflows/publish-plugins.yml)
[![فحص المصادر](https://github.com/chunma-san/lnreader-arabic-plugins/actions/workflows/arabic-health.yml/badge.svg)](https://github.com/chunma-san/lnreader-arabic-plugins/actions/workflows/arabic-health.yml)

نسخة مستقلة من [LNReader Plugins](https://github.com/LNReader/lnreader-plugins)، مخصصة لمتابعة المصادر العربية وإصلاحها وإضافة مصادر جديدة مع الوقت.

## إضافتها إلى التطبيق

أضف هذا الرابط إلى قائمة مستودعات الإضافات في LNReader:

```text
https://raw.githubusercontent.com/chunma-san/lnreader-arabic-plugins/plugins/v3.0.0/.dist/plugins.min.json
```

حدّث قائمة الإضافات، ثم ثبّت المصادر التي تريدها. هذه قائمة إضافات للتطبيق، وليست نسخة جديدة من LNReader.

تحتفظ الإضافات بمعرّفاتها الأصلية. إذا كنت تستخدم المستودع الأصلي أيضاً، فقد يظهر المصدر نفسه في القائمتين؛ اختر نسخة هذا المستودع للمصادر التي تريد متابعة إصلاحاتنا لها. احتفظ بنسخة احتياطية من مكتبتك قبل تغيير مصدر تستخدمه بالفعل.

## ما الذي يشمله المستودع؟

- قائمة تحميل تضم المصادر العربية فقط، بما فيها Kol Novel وRiwyat.
- بناء تلقائي عند تعديل المصادر أو أدوات البناء، والتحقق من ملفات الإضافات والصور قبل نشرها.
- فحص يومي للمصادر العربية: عرض الروايات، البحث، تفاصيل الرواية وقراءة فصل.
- تقرير يفرّق بين إضافة تعمل، وفشل يحتاج تحقيقاً، وفحص لم يُحسم بسبب الاتصال أو حماية الموقع.

قائمة المصادر وحدود الفحص موجودة في [ARABIC_SOURCES.md](ARABIC_SOURCES.md). وجود مصدر في القائمة لا يضمن أنه يعمل حالياً؛ تقارير [Arabic Plugin Health](https://github.com/chunma-san/lnreader-arabic-plugins/actions/workflows/arabic-health.yml) تعرض آخر نتائج الفحص في الملخص وملف `arabic-source-health`.

## التطوير والصيانة

يتطلب البناء Node.js 22 أو أحدث وnpm:

```sh
npm ci --ignore-scripts
npm run build:arabic
npm run check:arabic
```

لتجربة مصدر واحد، يمكن تمرير اسم ملفه:

```sh
npm run check:arabic -- "Riwyat[madara].ts"
```

نحتفظ بالمصادر والقوالب المشتركة وتاريخ المشروع الأصلي لتسهيل متابعة تحديثاته. الذي يُبنى ويُنشر هنا هو الإضافات العربية فقط. الفحص اليومي يقارن إصدار المصدر الأصلي بالنسخة المسجلة في `upstream.json`؛ دمج التغييرات يتم بعد المراجعة، وليس باستبدال إصلاحاتنا تلقائياً.

لإضافة موقع أو إصلاح مصدر، راجع [دليل الصيانة](docs/arabic-maintenance.md) و[واجهة الإضافات](docs/docs.md). لا يُرسل هذا المستودع مساهمات أو تعليقات إلى المشروع الأصلي تلقائياً.

## الحقوق

صيانة [chunma-san](https://github.com/chunma-san). مبني على عمل مطوري [LNReader Plugins](https://github.com/LNReader/lnreader-plugins) والمساهمين فيه، مع الحفاظ على حقوقهم ورخصة [MIT](LICENSE).

المشروع مستقل عن LNReader وعن مواقع المحتوى. تبقى [قائمة المواقع المستبعدة](BLACKLIST.json) محفوظة وتُراجع قبل إضافة أي مصدر جديد.
