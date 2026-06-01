// src/app/components/scheme-form.component.ts
import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SchemeService } from '../services/scheme.service';
import { Scheme } from '../models/scheme.model';

@Component({
  selector: 'app-scheme-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">
        {{ scheme ? 'تعديل الوزن' : 'إضافة وزن جديد' }}
      </h2>

      <!-- Error message with close button -->
      <div *ngIf="error" class="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex justify-between items-center">
        <span>{{ error }}</span>
        <button type="button" (click)="clearError()" class="text-red-700 hover:text-red-900">
          <span class="text-xl">&times;</span>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">النمط (الوزن)</label>
          <input type="text"
                 formControlName="pattern"
                 [attr.disabled]="scheme ? true : null"
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB116] focus:border-transparent text-2xl text-center"
                 [class.bg-gray-100]="scheme ? true : false"
                 [class.cursor-not-allowed]="scheme ? true : false"
                 placeholder="مثال: فاعل"
                 maxlength="10">
          <div *ngIf="!scheme && form.get('pattern')?.invalid && form.get('pattern')?.touched"
               class="text-red-500 text-sm mt-1">
            <span *ngIf="form.get('pattern')?.errors?.['required']">
              الرجاء إدخال النمط
            </span>
            <span *ngIf="form.get('pattern')?.errors?.['patternExists']">
              هذا الوزن موجود بالفعل
            </span>
          </div>
          <div *ngIf="scheme" class="text-gray-500 text-sm mt-1">
            لا يمكن تعديل الوزن
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">الاسم</label>
          <input type="text"
                 formControlName="name"
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB116] focus:border-transparent"
                 placeholder="مثال: اسم الفاعل">
          <div *ngIf="form.get('name')?.invalid && form.get('name')?.touched"
               class="text-red-500 text-sm mt-1">
            الرجاء إدخال الاسم
          </div>
        </div>

        <div class="flex space-x-reverse space-x-4">
          <button type="submit"
                  [disabled]="form.invalid || loading"
                  class="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
            <span *ngIf="loading" class="inline-block animate-spin mr-2">⏳</span>
            {{ scheme ? 'حفظ التعديلات' : 'إضافة' }}
          </button>
          <button type="button"
                  (click)="onCancel()"
                  [disabled]="loading"
                  class="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition disabled:opacity-50">
            إلغاء
          </button>
        </div>
      </form>
    </div>
  `
})
export class SchemeFormComponent implements OnInit, OnDestroy {
  @Input() scheme: Scheme | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form: FormGroup;
  loading = false;
  error = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private schemeService: SchemeService
  ) {
    this.form = this.fb.group({
      pattern: ['', [Validators.required]],
      name: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    console.log('📝 SchemeFormComponent initialized, scheme:', this.scheme);
    
    // Add the custom validator only when creating a new scheme
    const patternControl = this.form.get('pattern');
    if (patternControl && !this.scheme) {
      patternControl.setValidators([
        Validators.required,
        this.patternExistsValidator.bind(this)
      ]);
      patternControl.updateValueAndValidity();
    }
    
    if (this.scheme) {
      this.form.patchValue({
        pattern: this.scheme.pattern,
        name: this.scheme.name
      });
      
      // Disable the pattern field in edit mode
      patternControl?.disable();
    }

    // Subscribe to loading and error states
    this.subscriptions.push(
      this.schemeService.loading$.subscribe(loading => {
        this.loading = loading;
      })
    );
    
    this.subscriptions.push(
      this.schemeService.error$.subscribe(error => {
        this.error = error || '';
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Custom validator to check whether the pattern already exists (used only when creating a new scheme)
   */
  private patternExistsValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value || control.value.trim() === '') return null;
    
    const newPattern = control.value.trim();
    const existingScheme = this.schemeService.getSchemeByPattern(newPattern);
    return existingScheme ? { patternExists: true } : null;
  }

  onSubmit() {
    console.log('📤 Form submission');
    
    if (this.form.valid) {
      if (this.scheme) {
        // Update an existing scheme - only the name can be changed
        const formValue = {
          name: this.form.value.name.trim()
        };
        
        if (this.scheme.name !== formValue.name) {
          console.log('🔄 Name updated:', this.scheme.name, '→', formValue.name);
          
          this.schemeService.updateScheme(this.scheme.id, formValue).subscribe({
            next: (response) => {
              console.log('✅ Update successful:', response);
              if (response.success) {
                this.form.reset();
                this.saved.emit();
              }
            },
            error: (err) => {
              console.error('❌ Update error:', err);
            }
          });
        } else {
          console.log('ℹ️ No changes detected');
          this.form.reset();
          this.saved.emit();
        }
      } else {
        // Create a new scheme
        const formValue = {
          pattern: this.form.value.pattern.trim(),
          name: this.form.value.name.trim()
        };
        
        console.log('➕ Creating new scheme:', formValue);
        
        this.schemeService.addScheme(formValue).subscribe({
          next: (response) => {
            console.log('✅ Scheme created successfully:', response);
            if (response.success) {
              this.form.reset();
              this.saved.emit();
            }
          },
          error: (err) => {
            console.error('❌ Create scheme error:', err);
          }
        });
      }
    }
  }

  onCancel() {
    console.log('❌ Operation cancelled');
    this.form.reset();
    this.cancelled.emit();
  }

  clearError() {
    this.schemeService.clearError();
  }
}