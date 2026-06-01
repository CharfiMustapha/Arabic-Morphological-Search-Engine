# دليل استيراد الجذور من ملف نصي

## نظرة عامة

تتيح هذه الميزة استيراد الجذور العربية من ملف نصي (`.txt`) بصيغة UTF-8. كل جذر يجب أن يكون على سطر منفصل.

## خطوات الاستخدام

### 1. إنشاء ملف نصي بصيغة UTF-8

أنشئ ملف بامتداد `.txt` يحتوي على الجذور (واحد لكل سطر).

**مثال:**

```
كتب

درس

علم

فعل

حرك

سمع

بصر

قال

ذهب

جاء

```

### 2. الذهاب إلى صفحة إدارة الجذور

- انقر على "الجذور" في القائمة العلوية

- أو من الصفحة الرئيسية، انقر على "إدارة الجذور"

### 3. استيراد الملف

- انقر على زر "📥 استيراد من ملف"

- اختر ملفك النصي

- سيتم عرض تقرير بالنتائج

## صيغة الملف

### المتطلبات

- **الترميز:** UTF-8 (مهم للحروف العربية)

- **امتداد الملف:** `.txt`

- **صيغة السطر:** جذر واحد لكل سطر

- **الجذر:** يجب أن يحتوي على 3 حروف على الأقل

### الأسطر المتجاهلة

- الأسطر الفارغة (يتم تجاهلها تلقائياً)

- الأسطر المكررة (إذا كان الجذر موجوداً بالفعل)

- الأسطر ذات أقل من 3 حروف

## تقرير الاستيراد

بعد الاستيراد، سترى تقرير يتضمن:

- **✓ تم استيراد:** عدد الجذور المضافة بنجاح

- **⚠️ تم تجاهل:** عدد الجذور المكررة

- **❌ أخطاء:** عدد الجذور غير الصالحة

### تفاصيل الأخطاء

يتم عرض سطر تفصيلي لكل جذر غير صالح، يتضمن:

- رقم السطر في الملف

- نص الجذر

- السبب (أقل من 3 حروف، إلخ)

## نصائح مهمة

1. **احفظ الملف بصيغة UTF-8**

   - في معظم محررات النصوص (Notepad++, VS Code, إلخ)

   - تأكد من اختيار UTF-8 عند الحفظ

2. **تجنب المسافات الإضافية**

   - سيتم حذف المسافات البادئة والنهائية تلقائياً

3. **استخدم الجذور الصحيحة**

   - تأكد من أن كل سطر يحتوي على جذر عربي صحيح

4. **الملف المثال**

   - يوجد ملف مثال بسم `example_roots.txt` يمكن استخدامه

## مثال عملي

### ملف الإدخال (`roots.txt`)

```
كتب

درس

علم

فعل

حرك

سمع

بصر

قال

ذهب

جاء

```

### النتيجة المتوقعة

- ✓ تم استيراد: 10 جذر

- ⚠️ تم تجاهل: 0 جذر مكرر

- ❌ أخطاء: 0 جذر

## معالجة الأخطاء

إذا حدث خطأ في قراءة الملف:

- تأكد من أن الملف بصيغة `.txt`

- تأكد من الترميز UTF-8

- حاول مرة أخرى

## الإجراءات اللاحقة

بعد الاستيراد الناجح، يمكنك:

1. تعديل معاني الجذور (أضيفت بشكل فارغ)

2. حذف الجذور غير المرغوبة

3. إضافة جذور إضافية يدوياً

4. استخدام الجذور في التوليد والتحقق


# Arabic Roots Import Guide (Text File)

## Overview

This feature allows importing Arabic roots from a UTF-8 encoded text file (.txt). Each root must be written on a separate line.

## How to Use

### 1. Create a UTF-8 text file

Create a .txt file containing the roots, one per line.

**Example:**

```
كتب

درس

علم

فعل

حرك

سمع

بصر

قال

ذهب

جاء

```

### 2. Go to Roots Management Page

- Click on "Roots" in the top menu
- Or select "Manage Roots" from the homepage

### 3. Import the file

- Click on "انقر على زر "📥 

- Select your .txt file

- A report will be displayed after processing

## File Format

### Requirements

- Encoding: UTF-8

- Extension: .txt

- One root per line

- Minimum 3 characters per root

### Ignored lines

- Empty lines

- Duplicate roots

- Roots with less than 3 characters

## Import Report

After import, you will see:

- ✓ Successfully imported roots

- ⚠️ Duplicate roots skipped

- ❌ Invalid roots/errors

### Error details include:

- Line number

- Root value

- Error reason

## ❗ Error Handling
If import fails:

1. Ensure file is .txt

2. Ensure UTF-8 encoding

3. Try again

## 🔄 Next Steps

After successful import, you can:

1. Edit root meanings
2. Delete unwanted roots
3. Add new roots manually
4. Use roots in generation & validation