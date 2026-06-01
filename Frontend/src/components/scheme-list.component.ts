// src/app/components/scheme-list.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SchemeService } from '../services/scheme.service';
import { Scheme } from '../models/scheme.model';
import { SchemeFormComponent } from './scheme-form.component';

@Component({
  selector: 'app-scheme-list',
  standalone: true,
  imports: [CommonModule, SchemeFormComponent],
  template: `
    <div class="pt-16 container mx-auto px-4 py-8">
      <div class="max-w-6xl mx-auto">

        <!-- Loading indicator -->
        <div *ngIf="loading" class="fixed top-20 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center">
          <span class="animate-spin mr-2">⏳</span> جاري التحميل...
        </div>

        <!-- Temporary success message -->
        <div *ngIf="successMessage" class="mb-4 p-4 bg-green-100 border-r-4 border-green-500 text-green-700 rounded-lg flex justify-between items-center">
          <span>{{ successMessage }}</span>
          <button (click)="successMessage = ''" class="text-green-900 hover:text-green-700">✕</button>
        </div>

        <!-- Global error message -->
        <div *ngIf="globalError" class="mb-4 p-4 bg-red-100 border-r-4 border-red-500 text-red-700 rounded-lg flex justify-between items-center">
          <span>{{ globalError }}</span>
          <button (click)="clearError()" class="text-red-900 hover:text-red-700">✕</button>
        </div>

        <!-- Header with actions -->
        <div class="flex justify-between items-center mb-8">
          <h1 class="text-3xl font-bold text-gray-800">إدارة الأوزان</h1>
          <div class="flex gap-4">
            <button (click)="toggleForm()"
                    class="bg-[#FFB116] hover:bg-[#E69E13] text-white px-6 py-3 rounded-lg transition font-semibold flex items-center">
              <span class="mr-2">➕</span> إضافة وزن جديد
            </button>
            <button (click)="triggerFileInput()"
                    class="bg-[#FFB116] hover:bg-[#E69E13] text-white px-6 py-3 rounded-lg transition font-semibold flex items-center">
              <span class="mr-2">📥</span> استيراد من ملف
            </button>
            <input #fileInput type="file"
                   accept=".txt"
                   hidden
                   (change)="onFileSelected($event)">
            <div class="bg-gray-50 px-6 py-3 rounded-lg text-center font-semibold border border-gray-200 text-[#FFB116]">
              📊 إجمالي الأوزان: {{ schemeCount }}
            </div>
          </div>
        </div>

        <!-- Form -->
        <div *ngIf="showForm" class="mb-8">
          <app-scheme-form [scheme]="editingScheme"
                           (saved)="onFormSaved()"
                           (cancelled)="toggleForm()">
          </app-scheme-form>
        </div>

        <!-- Import progress -->
        <div *ngIf="importProgress" class="mb-8 bg-blue-50 border-r-4 border-blue-500 rounded-lg p-6 shadow">
          <div class="mb-4">
            <h3 class="text-lg font-bold text-blue-800 mb-2">{{ importProgress.title }}</h3>
            <p class="text-blue-700 mb-4">{{ importProgress.message }}</p>
            <div class="space-y-2">
              <div *ngIf="importProgress.successful > 0"
                   class="text-green-700 font-semibold flex items-center">
                <span class="text-xl mr-2">✓</span> تم استيراد: {{ importProgress.successful }} وزن
              </div>
              <div *ngIf="importProgress.duplicates > 0"
                   class="text-yellow-700 font-semibold flex items-center">
                <span class="text-xl mr-2">⚠️</span> تم تجاهل: {{ importProgress.duplicates }} وزن مكرر
              </div>
              <div *ngIf="importProgress.errors > 0"
                   class="text-red-700 font-semibold flex items-center">
                <span class="text-xl mr-2">❌</span> أخطاء: {{ importProgress.errors }} وزن
              </div>
            </div>
          </div>

          <div *ngIf="importProgress.invalid.length > 0" class="mt-4 bg-red-50 rounded p-4 border border-red-200">
            <h4 class="text-red-800 font-bold mb-2">الأوزان غير الصالحة (تم تجاهلها):</h4>
            <div class="text-sm text-red-700 space-y-1 max-h-48 overflow-y-auto">
              <div *ngFor="let item of importProgress.invalid" class="py-1">
                السطر {{ item.line }}: "{{ item.text }}" - {{ item.reason }}
              </div>
            </div>
          </div>

          <button (click)="clearImportProgress()"
                  class="mt-4 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded transition text-sm">
            إغلاق
          </button>
        </div>

        <!-- Schemes grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let scheme of schemes; trackBy: trackBySchemeId"
               class="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition border-r-4 border-[#FFB116]">
            
            <div class="text-center flex-grow">
              <h3 class="text-3xl font-bold text-gray-800 mb-2">{{ scheme.pattern }}</h3>
              <h4 class="text-lg font-semibold text-[#FFB116] mb-2">{{ scheme.name }}</h4>
            </div>

            <div class="flex justify-between mt-4">
              <button (click)="editScheme(scheme)"
                      class="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-2 rounded transition text-sm font-semibold">
                ✏️ تعديل
              </button>
              <button (click)="confirmDelete(scheme)"
                      class="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded transition text-sm font-semibold">
                🗑️ حذف
              </button>
            </div>
          </div>

          <!-- No schemes message -->
          <div *ngIf="schemes.length === 0 && !loading"
               class="col-span-3 text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
            لا توجد أوزان حالياً. قم بإضافة وزن جديد للبدء.
          </div>
        </div>

        <!-- Delete confirmation modal -->
        <div *ngIf="schemeToDelete" class="fixed inset-0 flex items-center justify-center z-50">
          <!-- Dark overlay -->
          <div class="absolute inset-0 bg-black bg-opacity-50" (click)="cancelDelete()"></div>
          
          <!-- Modal content -->
          <div class="bg-white rounded-lg p-6 w-96 text-center relative z-10 shadow-2xl">
            <div class="mb-4 text-6xl">🗑️</div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">تأكيد الحذف</h3>
            <p class="mb-2 text-gray-600">هل أنت متأكد من حذف هذا الوزن نهائياً؟</p>
            <p class="mb-4 text-2xl font-bold text-[#FFB116] bg-gray-50 p-2 rounded">
              {{ schemeToDelete.pattern }} - {{ schemeToDelete.name }}
            </p>
            
            <div class="flex justify-around gap-4">
              <button (click)="deleteConfirmed()"
                      [disabled]="loading"
                      class="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-bold transition disabled:opacity-50 flex items-center justify-center">
                <span *ngIf="loading" class="inline-block animate-spin mr-2">⏳</span>
                حذف
              </button>
              <button (click)="cancelDelete()"
                      [disabled]="loading"
                      class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-lg font-bold transition disabled:opacity-50">
                إلغاء
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class SchemeListComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  schemes: Scheme[] = [];
  schemeCount = 0;
  showForm = false;
  editingScheme: Scheme | null = null;
  schemeToDelete: Scheme | null = null;
  importProgress: any = null;
  
  loading = false;
  globalError: string | null = null;
  successMessage: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private schemeService: SchemeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('🔄 Scheme list component initialized');
    
    // Subscribe to schemes list
    this.subscriptions.push(
      this.schemeService.schemes$.subscribe(schemes => {
        console.log('📋 Schemes updated:', schemes.length);
        this.schemes = [...schemes];
        this.schemeCount = schemes.length;
        this.cdr.detectChanges();
      })
    );

    // Subscribe to loading state
    this.subscriptions.push(
      this.schemeService.loading$.subscribe(loading => {
        this.loading = loading;
        this.cdr.detectChanges();
      })
    );

    // Subscribe to global errors
    this.subscriptions.push(
      this.schemeService.error$.subscribe(error => {
        this.globalError = error;
        if (error) {
          this.successMessage = null;
        }
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy() {
    console.log('🧹 Cleaning up subscriptions');
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  trackBySchemeId(index: number, scheme: Scheme): string {
    return scheme.id;
  }

  toggleForm() {
    this.showForm = !this.showForm;
    this.editingScheme = null;
  }

  editScheme(scheme: Scheme) {
    console.log('✏️ Editing scheme:', scheme.pattern);
    this.editingScheme = scheme;
    this.showForm = true;
  }

  confirmDelete(scheme: Scheme) {
    console.log('🗑️ Delete request for scheme:', scheme.pattern);
    this.schemeToDelete = scheme;
    this.cdr.detectChanges();
  }

  cancelDelete() {
    console.log('❌ Delete cancelled');
    this.schemeToDelete = null;
    this.cdr.detectChanges();
  }

  deleteConfirmed() {
    if (this.schemeToDelete) {
      console.log('🗑️ Delete confirmed', this.schemeToDelete.pattern);
      
      this.schemeService.deleteScheme(this.schemeToDelete.pattern).subscribe({
        next: (response) => {
          console.log('✅ Scheme deleted successfully', response);
          if (response.success) {
            this.successMessage = `✅ تم حذف الوزن "${this.schemeToDelete?.pattern}" بنجاح`;
            this.schemeToDelete = null;
            
            setTimeout(() => {
              this.successMessage = null;
              this.cdr.detectChanges();
            }, 3000);
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Delete error', error);
          this.globalError = 'حدث خطأ أثناء الحذف';
          this.schemeToDelete = null;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onFormSaved() {
    console.log('✅ Form saved successfully');
    this.showForm = false;
    this.editingScheme = null;
    this.successMessage = '✅ تمت العملية بنجاح';
    
    setTimeout(() => {
      this.successMessage = null;
      this.cdr.detectChanges();
    }, 3000);
  }

  triggerFileInput() {
    this.fileInput?.nativeElement?.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const content = e.target.result;
        const lines = content.split('\n');
        const result = this.schemeService.importSchemes(lines);
        this.importProgress = result;
        
        if (result.successful > 0) {
          this.successMessage = `✅ تم استيراد ${result.successful} وزن بنجاح`;
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        }
        
        this.cdr.detectChanges();
      } catch (error) {
        alert('خطأ في قراءة الملف: ' + error);
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  clearImportProgress() {
    this.importProgress = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    this.cdr.detectChanges();
  }

  clearError() {
    this.schemeService.clearError();
    this.globalError = null;
    this.cdr.detectChanges();
  }
}