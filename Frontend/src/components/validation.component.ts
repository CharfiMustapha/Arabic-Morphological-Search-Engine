import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MorphologyService } from '../services/morphology.service';

// Local interface for validation results
interface ValidationResult {
  isValid: boolean;
  message: string;
  word: string;
  root: string;
  scheme: string;
}

@Component({
  selector: 'app-validation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="pt-16 container mx-auto px-4 py-8" dir="rtl">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-800 mb-8">التحقق المورفولوجي</h1>

        <!-- Loading state indicator -->
        <div *ngIf="loading" class="fixed top-20 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center">
          <span class="animate-spin ml-2">⏳</span> جاري التحقق...
        </div>

        <!-- Error message -->
        <div *ngIf="error" class="mb-4 p-4 bg-red-100 border-r-4 border-red-500 text-red-700 rounded-lg flex justify-between items-center">
          <span>{{ error }}</span>
          <button (click)="clearError()" class="text-red-900 hover:text-red-700 mr-4">✕</button>
        </div>

        <!-- Validation form -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
          <form [formGroup]="form" (ngSubmit)="validate()">
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label class="block text-gray-700 font-semibold mb-2">الكلمة المراد التحقق منها</label>
                <input type="text"
                       formControlName="word"
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#28a8b8] focus:border-transparent text-2xl text-center"
                       placeholder="مثال: كاتب, خارج...">
                <div *ngIf="form.get('word')?.invalid && form.get('word')?.touched"
                     class="text-red-500 text-sm mt-1">
                  الرجاء إدخال كلمة
                </div>
              </div>
              <div>
                <label class="block text-gray-700 font-semibold mb-2">الجذر (3 حروف)</label>
                <input type="text"
                       formControlName="root"
                       maxlength="3"
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#28a8b8] focus:border-transparent text-2xl text-center"
                       placeholder="مثال: كتب, خرج...">
                <div *ngIf="form.get('root')?.invalid && form.get('root')?.touched"
                     class="text-red-500 text-sm mt-1">
                  <span *ngIf="form.get('root')?.errors?.['required']">الرجاء إدخال الجذر</span>
                  <span *ngIf="form.get('root')?.errors?.['minlength'] || form.get('root')?.errors?.['maxlength']">
                    الجذر يجب أن يتكون من 3 حروف بالضبط
                  </span>
                </div>
              </div>
            </div>

            <div class="mt-8 flex space-x-reverse space-x-4">
              <button type="submit"
                      [disabled]="form.invalid || loading"
                      class="flex-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:bg-gray-400 disabled:text-gray-600 px-6 py-3 rounded-lg transition text-lg font-semibold flex items-center justify-center">
                <span *ngIf="loading" class="inline-block animate-spin ml-2">⏳</span>
                🔍 التحقق المورفولوجي
              </button>
              <button type="button"
                      (click)="resetForm()"
                      [disabled]="loading"
                      class="bg-red-100 hover:bg-red-200 text-red-700 px-6 py-3 rounded-lg transition font-semibold disabled:opacity-50">
                مسح
              </button>
            </div>
          </form>
        </div>

        <!-- Validation result -->
        <div *ngIf="result" class="rounded-lg shadow-md p-6 mb-8"
             [ngClass]="{
               'bg-green-50 border-r-4 border-green-500': result.isValid,
               'bg-red-50 border-r-4 border-red-500': !result.isValid
             }">
          <div class="flex items-start">
            <div class="flex-shrink-0 ml-4">
              <svg *ngIf="result.isValid" class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <svg *ngIf="!result.isValid" class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="flex-1">
              <!-- Display: صحيح / غير صحيح -->
              <h3 class="text-2xl font-bold mb-2"
                  [ngClass]="{
                    'text-green-800': result.isValid,
                    'text-red-800': !result.isValid
                  }">
                {{ result.isValid ? 'صحيح' : 'غير صحيح' }}
              </h3>
              <div *ngIf="result.isValid" class="bg-white rounded-lg p-6 mt-4">
                <div class="grid md:grid-cols-3 gap-4">
                  <div class="text-center">
                    <span class="text-sm text-gray-600 block mb-2">الجذر</span>
                    <div class="text-3xl font-bold text-emerald-600">{{ result.root }}</div>
                  </div>
                  <div class="text-center">
                    <span class="text-sm text-gray-600 block mb-2">الوزن الصرفي</span>
                    <div class="text-3xl font-bold text-blue-600">{{ result.scheme }}</div>
                  </div>
                  <div class="text-center">
                    <span class="text-sm text-gray-600 block mb-2">الكلمة</span>
                    <div class="text-3xl font-bold text-purple-600">{{ result.word }}</div>
                  </div>
                </div>
              </div>

              <div *ngIf="!result.isValid" class="mt-4 bg-white rounded-lg p-4 border-r-4 border-[#28a8b8]">
                <h4 class="font-bold text-[#28a8b8] mb-2">💡 اقتراحات:</h4>
                <ul class="text-sm text-gray-600 space-y-1 mr-4">
                  <li>• تأكد من كتابة الكلمة بشكل صحيح</li>
                  <li>• تأكد من كتابة الجذر بشكل صحيح (3 حروف)</li>
                  <li>• جرب جذراً آخر قد يكون مرتبطاً بالكلمة</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Initial state -->
        <div *ngIf="!result && !attempted" class="bg-[#f6fdfe] border-r-4 border-[#28a8b8] rounded-lg p-6 mt-8">
          <h3 class="font-bold text-[#28a8b8] mb-3">كيفية الاستخدام:</h3>
          <ul class="text-[#28a8b9] space-y-2 text-sm mr-4">
            <li><strong>الخطوة 1:</strong> أدخل الكلمة العربية التي تريد التحقق منها</li>
            <li><strong>الخطوة 2:</strong> أدخل الجذر (3 حروف)</li>
            <li><strong>الخطوة 3:</strong> انقر على زر "التحقق المورفولوجي"</li>
            <li><strong>النتيجة:</strong> ستظهر النتيجة: <span class="text-green-600">صحيح</span> إذا كانت الكلمة مشتقة من الجذر، أو <span class="text-red-600">غير صحيح</span> إذا لم تكن كذلك</li>
          </ul>
        </div>

        <!-- Message displayed when a validation attempt returns no result -->
        <div *ngIf="!result && attempted && !loading && !error" class="bg-yellow-50 border-r-4 border-yellow-500 rounded-lg p-6 mt-8">
          <p class="text-yellow-800 text-center">
            لم يتم العثور على نتيجة. أدخل كلمة عربية للتحقق من صحتها المورفولوجية
          </p>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      direction: rtl;
    }
    input:focus {
      outline: none;
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class ValidationComponent implements OnInit, OnDestroy {
  form: FormGroup;
  result: ValidationResult | null = null;
  attempted = false;
  
  // Component states
  loading = false;
  error: string | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private morphologyService: MorphologyService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      word: ['', [Validators.required]],
      root: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(3)
      ]]
    });
  }

  ngOnInit() {
    console.log('🔄 Initializing validation component');

    // Subscribe to loading state
    this.subscriptions.push(
      this.morphologyService.loading$.subscribe(loading => {
        this.loading = loading;
        this.cdr.detectChanges();
      })
    );

    // Subscribe to error state
    this.subscriptions.push(
      this.morphologyService.error$.subscribe(error => {
        this.error = error;
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy() {
    console.log('🧹 Cleaning up validation component');
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  validate() {
    if (this.form.valid) {
      console.log('🚀 Starting validation process');
      
      const word = this.form.value.word.trim();
      const root = this.form.value.root.trim();

      this.attempted = true;
      this.error = null;
      
      // Call MorphologyService
      this.morphologyService.validateWord(word, root).subscribe({
        next: (response: any) => {
          console.log('✅ Validation response received:', response);
          
          // Handle response using the new JSON format
          // response.data.isValid contains "true" or "false" as a string
          // response.data.schema contains the morphological pattern (e.g. "فاعل")
          const isValid = response?.data?.isValid === "true";
          
          // Create the validation result object including the pattern
          this.result = {
            isValid: isValid,
            message: response?.message || (isValid ? 'الكلمة صحيحة' : 'الكلمة غير صحيحة'),
            word: response?.data?.word || word,
            root: response?.data?.root || root,
            scheme: response?.data?.schema || 'غير معروف' // ← Retrieve the pattern
          };
          
          console.log('📊 Result:', this.result);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Validation error:', error);
          this.error = error?.error?.message || error?.message || 'حدث خطأ أثناء التحقق';
          this.cdr.detectChanges();
        }
      });
    } else {
      // Mark all fields as touched to display validation errors
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
    }
  }

  resetForm() {
    this.form.reset();
    this.result = null;
    this.attempted = false;
    this.error = null;
  }

  clearError() {
    this.error = null;
    this.cdr.detectChanges();
  }
}