// src/app/components/generation.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RootService } from '../services/root.service';
import { SchemeService } from '../services/scheme.service';
import { MorphologyService } from '../services/morphology.service';
import { Root } from '../models/root.model';
import { Scheme } from '../models/scheme.model';
import { DerivedWord } from '../models/derived-word.model';

@Component({
  selector: 'app-generation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="pt-16 container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        
        <!-- Header -->
        <h1 class="text-3xl font-bold text-gray-800 mb-8">التوليد المورفولوجي</h1>

        <!-- Loading indicator -->
        <div *ngIf="loading" class="fixed top-20 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center">
          <span class="animate-spin mr-2">⏳</span> جاري التوليد...
        </div>

        <!-- Error message -->
        <div *ngIf="error" class="mb-4 p-4 bg-red-100 border-r-4 border-red-500 text-red-700 rounded-lg flex justify-between items-center">
          <span>{{ error }}</span>
          <button (click)="clearError()" class="text-red-900 hover:text-red-700">✕</button>
        </div>

        <!-- Success message -->
        <div *ngIf="successMessage" class="mb-4 p-4 bg-green-100 border-r-4 border-green-500 text-green-700 rounded-lg flex justify-between items-center">
          <span>{{ successMessage }}</span>
          <button (click)="successMessage = ''" class="text-green-900 hover:text-green-700">✕</button>
        </div>

        <!-- Generation form -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
          <form [formGroup]="form" (ngSubmit)="generate()">
            <!-- Root selection -->
            <div class="mb-6">
              <label class="block text-gray-700 font-semibold mb-2">اختر الجذر</label>
              <select formControlName="rootId"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFA29A] focus:border-transparent
                             [&_option:hover]:bg-[#FFA29A]/30 [&_option:checked]:bg-[#FFA29A]/40">
                <option value="">-- اختر جذراً --</option>
                <option *ngFor="let root of roots" [value]="root.id">
                  {{ root.letters }}
                </option>
              </select>
              <div *ngIf="form.get('rootId')?.invalid && form.get('rootId')?.touched"
                   class="text-red-500 text-sm mt-1">
                الرجاء اختيار جذر
              </div>
            </div>

            <!-- Scheme selection -->
            <div class="mb-6">
              <label class="block text-gray-700 font-semibold mb-3">اختر الأوزان</label>
              
              <!-- Schemes loading indicator -->
              <div *ngIf="schemesLoading" class="text-center py-4 text-gray-500">
                جاري تحميل الأوزان...
              </div>

              <!-- Schemes list -->
              <div *ngIf="!schemesLoading" class="space-y-3">
                <!-- Quick selection buttons -->
                <div class="flex gap-2 mb-4" *ngIf="schemes.length > 0">
                  <button type="button"
                    (click)="selectAllSchemes()"
                    class="flex-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-6 py-3 rounded-lg transition font-semibold">
                     تحديد الكل
                  </button>

                  <button type="button"
                    (click)="deselectAllSchemes()"
                    class="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-6 py-3 rounded-lg transition font-semibold">
                   إلغاء الكل
                  </button>
                </div>

                <!-- Scheme grid -->
                <div class="grid md:grid-cols-2 gap-3">
                  <div *ngFor="let scheme of schemes" class="flex items-center p-2 hover:bg-[#FFA29A]/5 rounded transition">
                    <input type="checkbox"
                           [id]="'scheme-' + scheme.id"
                           [checked]="isSchemeSelected(scheme.id)"
                           (change)="onSchemeChange(scheme.id, $event)"
                           class="w-4 h-4 accent-[#FFA29A] cursor-pointer">
                    <label [for]="'scheme-' + scheme.id" class="mr-2 text-gray-700 cursor-pointer flex-1">
                      <span class="font-semibold">{{ scheme.pattern }}</span>
                      <span class="text-sm text-gray-500 mr-1">- {{ scheme.name }}</span>
                    </label>
                  </div>
                </div>
              </div>

              <!--  No schemes message -->
              <div *ngIf="!schemesLoading && schemes.length === 0"
                   class="text-center py-4 text-gray-500 bg-gray-50 rounded">
                لا توجد أوزان متاحة. قم بإضافة أوزان أولاً.
              </div>

              <div *ngIf="form.valid && selectedSchemes.length === 0 && form.get('rootId')?.touched"
                   class="text-red-500 text-sm mt-2">
                الرجاء اختيار وزن واحد على الأقل
              </div>
            </div>

            <!-- Generate button -->
            <button type="submit"
                    [disabled]="form.invalid || selectedSchemes.length === 0 || loading || schemes.length === 0"
                    class="w-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:bg-gray-400 disabled:text-gray-600 px-6 py-3 rounded-lg transition text-lg font-semibold flex items-center justify-center">
              <span *ngIf="loading" class="inline-block animate-spin mr-2">⏳</span>
              🔤 توليد الكلمات
            </button>
          </form>
        </div>

        <!-- Generated results -->
        <div *ngIf="generatedWords.length > 0" class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">الكلمات المولدة ({{ generatedWords.length }})</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div *ngFor="let word of generatedWords; trackBy: trackByWordId"
                 class="bg-[#FFA29A] bg-opacity-5 border-r-4 border-[#FFA29A] rounded-lg p-4 hover:shadow-md transition">
              <div class="text-center">
                <div class="text-2xl font-bold text-gray-800 mb-3">{{ word.word }}</div>
                <div class="text-sm text-gray-600 space-y-1">
                  <div>
                    <span class="font-semibold">الجذر:</span> {{ word.root }}
                  </div>
                  <div>
                    <span class="font-semibold">الوزن:</span> {{ word.scheme }}
                    <span *ngIf="word.schemeName" class="text-gray-500 mr-1">({{ word.schemeName }})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Clear results button -->
          <div class="mt-6 text-center">
            <button (click)="clearResults()"
                    class="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded transition text-sm">
              مسح النتائج
            </button>
          </div>
        </div>

        <!-- Initial state (no generation yet) -->
        <div *ngIf="generatedWords.length === 0 && !loading && !error" 
             class="bg-[#FFA29A] bg-opacity-5 border-r-4 border-[#FFA29A] rounded-lg p-6 mt-8">
          <h3 class="font-bold text-[#FFA29A] mb-3 text-lg">كيفية الاستخدام:</h3>
          <ul class="text-gray-700 space-y-3 text-base">
            <li class="flex items-start">
              <span class="text-[#FFA29A] font-bold ml-2">١.</span>
              <span>اختر الجذر من القائمة المنسدلة</span>
            </li>
            <li class="flex items-start">
              <span class="text-[#FFA29A] font-bold ml-2">٢.</span>
              <span>اختر الوزن أو الأوزان التي تريدها من القائمة</span>
            </li>
            <li class="flex items-start">
              <span class="text-[#FFA29A] font-bold ml-2">٣.</span>
              <span>انقر على زر "توليد الكلمات"</span>
            </li>
            <li class="flex items-start">
              <span class="text-[#FFA29A] font-bold ml-2">٤.</span>
              <span>ستظهر الكلمات المولدة مع الجذر والوزن المستخدم</span>
            </li>
          </ul>
        </div>

        <!-- No results after attempt -->
        <div *ngIf="generatedWords.length === 0 && attempted && !loading && !error"
             class="bg-[#FFA29A] bg-opacity-5 border-r-4 border-[#FFA29A] rounded-lg p-6 text-center mt-8">
          <p>
            لم يتم توليد أي كلمات. قد يكون الجذر أو الأوزان المختارة غير مناسبة للتوليد.
          </p>
        </div>
      </div>
    </div>
  `
})
export class GenerationComponent implements OnInit, OnDestroy {
  roots: Root[] = [];
  schemes: Scheme[] = [];
  selectedSchemes: string[] = [];
  generatedWords: DerivedWord[] = [];
  
  loading = false;
  schemesLoading = false;
  error: string | null = null;
  successMessage: string | null = null;
  attempted = false;

  form: FormGroup;

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private rootService: RootService,
    private schemeService: SchemeService,
    private morphologyService: MorphologyService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      rootId: ['', Validators.required]
    });
  }

  ngOnInit() {
    console.log('🔄 Initializing generation component');
    
    // Load roots
    this.subscriptions.push(
      this.rootService.roots$.subscribe(roots => {
        console.log('📋 Roots loaded:', roots.length);
        this.roots = roots;
        this.cdr.detectChanges();
      })
    );

    // Load schemes with loading indicator
    this.schemesLoading = true;
    this.subscriptions.push(
      this.schemeService.schemes$.subscribe(schemes => {
        console.log('📋 Schemes loaded:', schemes.length);
        this.schemes = schemes;
        this.schemesLoading = false;
        this.cdr.detectChanges();
      })
    );

    // Loading state subscription
    this.subscriptions.push(
      this.morphologyService.loading$.subscribe(loading => {
        this.loading = loading;
        this.cdr.detectChanges();
      })
    );

    // Error handling subscription
    this.subscriptions.push(
      this.morphologyService.error$.subscribe(error => {
        this.error = error;
        if (error) {
          this.successMessage = null;
        }
        this.cdr.detectChanges();
      })
    );

    // Generated words subscription
    this.subscriptions.push(
      this.morphologyService.generatedWords$.subscribe(words => {
        console.log('📝 Generated words received:', words.length);
        this.generatedWords = words;
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy() {
    console.log('🧹 Cleaning up generation component');
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.morphologyService.clearGeneratedWords();
  }

  trackByWordId(index: number, word: DerivedWord): string {
    return word.id;
  }

  isSchemeSelected(schemeId: string): boolean {
    return this.selectedSchemes.includes(schemeId);
  }

  onSchemeChange(schemeId: string, event: any) {
    if (event.target.checked) {
      this.selectedSchemes.push(schemeId);
      this.successMessage = `✅ تمت إضافة الوزن`;
    } else {
      this.selectedSchemes = this.selectedSchemes.filter(id => id !== schemeId);
      this.successMessage = `❌ تمت إزالة الوزن`;
    }

    // Clear message after 2 seconds
    setTimeout(() => {
      this.successMessage = null;
      this.cdr.detectChanges();
    }, 2000);

    this.cdr.detectChanges();
  }

  selectAllSchemes() {
    this.selectedSchemes = this.schemes.map(s => s.id);
    this.successMessage = `✅ تم تحديد جميع الأوزان (${this.selectedSchemes.length})`;
    
    setTimeout(() => {
      this.successMessage = null;
      this.cdr.detectChanges();
    }, 2000);
    
    this.cdr.detectChanges();
  }

  deselectAllSchemes() {
    this.selectedSchemes = [];
    this.successMessage = `❌ تم إلغاء تحديد جميع الأوزان`;
    
    setTimeout(() => {
      this.successMessage = null;
      this.cdr.detectChanges();
    }, 2000);
    
    this.cdr.detectChanges();
  }

  generate() {
    if (this.form.valid && this.selectedSchemes.length > 0) {
      console.log('🚀 Starting generation');
      
      const rootId = this.form.value.rootId;
      const root = this.roots.find(r => r.id === rootId);
      
      if (!root) {
        this.error = 'الرجاء اختيار جذر صحيح';
        return;
      }

      this.attempted = true;
      this.error = null;
      
      this.morphologyService.generateWords(rootId, this.selectedSchemes);
      
      this.successMessage = `✅ تم توليد الكلمات بنجاح`;
      
      setTimeout(() => {
        this.successMessage = null;
        this.cdr.detectChanges();
      }, 3000);
    }
  }

  clearResults() {
    this.morphologyService.clearGeneratedWords();
    this.successMessage = '✅ تم مسح النتائج';
    
    setTimeout(() => {
      this.successMessage = null;
      this.cdr.detectChanges();
    }, 2000);
  }

  clearError() {
    this.morphologyService.clearError();
    this.error = null;
    this.cdr.detectChanges();
  }
}