// src/app/components/root-list.component.ts
import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { RootService } from '../services/root.service';
import { Root } from '../models/root.model';
import { RootFormComponent } from './root-form.component';

@Component({
  selector: 'app-root-list',
  standalone: true,
  imports: [CommonModule, RootFormComponent, HttpClientModule],
  template: `
    <div class="pt-16 container mx-auto px-4 py-8">
      <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-800 mb-8">إدارة الجذور</h1>

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

        <!-- Actions -->
        <div class="grid md:grid-cols-3 gap-4 mb-8">
          <button (click)="toggleForm()"
                  class="bg-[#058c42] hover:bg-[#047336] text-white px-6 py-3 rounded-lg transition font-semibold flex items-center justify-center">
            <span class="mr-2">➕</span> إضافة جذر جديد
          </button>
          <button (click)="triggerFileInput()"
                  class="bg-[#058c42] hover:bg-[#047336] text-white px-6 py-3 rounded-lg transition font-semibold flex items-center justify-center">
            <span class="mr-2">📥</span> استيراد من ملف
          </button>
          <input #fileInput type="file"
                 accept=".txt"
                 hidden
                 (change)="onFileSelected($event)">
          <div class="text-[#047336] bg-gray-50 px-6 py-3 rounded-lg text-center font-semibold border border-gray-200">
            📊 إجمالي الجذور: {{ rootCount }}
          </div>
        </div>

        <!-- Add/Edit form -->
        <div *ngIf="showForm" class="mb-8">
          <app-root-form [root]="editingRoot"
                         (saved)="onFormSaved()"
                         (cancelled)="toggleForm()">
          </app-root-form>
        </div>

        <!-- Import progress -->
        <div *ngIf="importProgress" class="mb-8 bg-blue-50 border-r-4 border-blue-500 rounded-lg p-6 shadow">
          <div class="mb-4">
            <h3 class="text-lg font-bold text-blue-800 mb-2">{{ importProgress.title }}</h3>
            <p class="text-blue-700 mb-4">{{ importProgress.message }}</p>
            <div class="space-y-2">
              <div *ngIf="importProgress.successful > 0"
                   class="text-green-700 font-semibold flex items-center">
                <span class="text-xl mr-2">✓</span> تم استيراد: {{ importProgress.successful }} جذر
              </div>
              <div *ngIf="importProgress.duplicates > 0"
                   class="text-yellow-700 font-semibold flex items-center">
                <span class="text-xl mr-2">⚠️</span> تم تجاهل: {{ importProgress.duplicates }} جذر مكرر
              </div>
              <div *ngIf="importProgress.errors > 0"
                   class="text-red-700 font-semibold flex items-center">
                <span class="text-xl mr-2">❌</span> أخطاء: {{ importProgress.errors }} جذر
              </div>
            </div>
          </div>

          <div *ngIf="importProgress.invalid.length > 0" class="mt-4 bg-red-50 rounded p-4 border border-red-200">
            <h4 class="text-red-800 font-bold mb-2">الجذور غير الصالحة (تم تجاهلها):</h4>
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

        <!-- Root list -->
        <div class="grid gap-4">
          <div *ngIf="roots.length === 0 && !loading" class="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
            <p class="text-gray-600 text-lg">لا توجد جذور حالياً. قم بإضافة جذر أو استيراد من ملف.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div *ngFor="let root of roots; trackBy: trackByRootId"
                 class="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition border-r-4 border-[#058c42]">

              <div class="text-center flex-grow">
                <div class="text-3xl font-bold text-gray-800">
                  {{ root.letters }}
                </div>
                <div *ngIf="root.meaning" class="text-sm text-gray-600 mt-1">
                  {{ root.meaning }}
                </div>
              </div>

              <div class="flex justify-between mt-4">
                <button (click)="editRoot(root)"
                        class="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-2 rounded transition text-sm font-semibold">
                  ✏️ تعديل
                </button>
                <button (click)="confirmDelete(root)"
                        class="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded transition text-sm font-semibold">
                  🗑️ حذف
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Delete confirmation modal -->
        <div *ngIf="rootToDelete" class="fixed inset-0 flex items-center justify-center z-50">
          <!-- Dark overlay -->
          <div class="absolute inset-0 bg-black bg-opacity-50" (click)="cancelDelete()"></div>
          
          <!-- Modal content -->
          <div class="bg-white rounded-lg p-6 w-96 text-center relative z-10 shadow-2xl">
            <div class="mb-4 text-6xl">🗑️</div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">تأكيد الحذف</h3>
            <p class="mb-2 text-gray-600">هل أنت متأكد من حذف هذا الجذر نهائياً؟</p>
            <p class="mb-4 text-2xl font-bold text-[#058c42] bg-gray-50 p-2 rounded">
              {{ rootToDelete.letters }}
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
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
  `]
})
export class RootListComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  roots: Root[] = [];
  rootCount = 0;
  showForm = false;
  editingRoot: Root | null = null;
  importProgress: any = null;
  rootToDelete: Root | null = null;
  
  loading = false;
  globalError: string | null = null;
  successMessage: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private rootService: RootService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('🔄 Root list component initialized');
    
    // Subscribe to roots list
    this.subscriptions.push(
      this.rootService.roots$.subscribe(roots => {
        console.log('📋 Roots updated', roots.length);
        this.roots = [...roots];
        this.rootCount = roots.length;
        this.cdr.detectChanges();
      })
    );

    // Subscribe to loading state
    this.subscriptions.push(
      this.rootService.loading$.subscribe(loading => {
        this.loading = loading;
        this.cdr.detectChanges();
      })
    );

    // Subscribe to global errors
    this.subscriptions.push(
      this.rootService.error$.subscribe(error => {
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

  trackByRootId(index: number, root: Root): string {
    return root.id;
  }

  toggleForm() {
    this.showForm = !this.showForm;
    this.editingRoot = null;
  }

  editRoot(root: Root) {
    console.log('✏️ Editing root', root.letters);
    this.editingRoot = root;
    this.showForm = true;
  }

  confirmDelete(root: Root) {
    console.log('🗑️ Delete request for root', root.letters);
    this.rootToDelete = root;
    this.cdr.detectChanges();
  }

  cancelDelete() {
    console.log('❌ Delete cancelled');
    this.rootToDelete = null;
    this.cdr.detectChanges();
  }

  deleteConfirmed() {
    if (this.rootToDelete) {
      console.log('🗑️ Delete confirmed', this.rootToDelete.letters);
      
      this.rootService.deleteRoot(this.rootToDelete.letters).subscribe({
        next: (response) => {
          console.log('✅ Root deleted successfully', response);
          if (response.success) {
            this.successMessage = `✅ تم حذف الجذر "${this.rootToDelete?.letters}" بنجاح`;
            this.rootToDelete = null;
            
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
          this.rootToDelete = null;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onFormSaved() {
    console.log('✅ Form saved successfully');
    this.showForm = false;
    this.editingRoot = null;
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
        const result = this.rootService.importRoots(lines);
        this.importProgress = result;
        
        if (result.successful > 0) {
          this.successMessage = `✅ تم استيراد ${result.successful} جذر بنجاح`;
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
    this.rootService.clearError();
    this.globalError = null;
    this.cdr.detectChanges();
  }
}