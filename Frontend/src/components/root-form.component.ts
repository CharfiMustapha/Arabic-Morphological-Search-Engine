// src/app/components/root-form.component.ts
import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RootService } from '../services/root.service';
import { Root } from '../models/root.model';

@Component({
  selector: 'app-root-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">
        {{ root ? 'تعديل الجذر' : 'إضافة جذر جديد' }}
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
          <label class="block text-gray-700 font-semibold mb-2">الجذر (3 حروف)</label>
          <input type="text"
                 formControlName="letters"
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#058c42] focus:border-transparent text-2xl text-center"
                 placeholder="مثال: كتب"
                 maxlength="3">
          <div *ngIf="form.get('letters')?.invalid && form.get('letters')?.touched"
               class="text-red-500 text-sm mt-1">
            <span *ngIf="form.get('letters')?.errors?.['required']">
              الرجاء إدخال الجذر
            </span>
            <span *ngIf="form.get('letters')?.errors?.['minlength'] || form.get('letters')?.errors?.['maxlength']">
              الجذر يجب أن يتكون من 3 حروف بالضبط
            </span>
            <span *ngIf="form.get('letters')?.errors?.['rootExists']">
              هذا الجذر موجود بالفعل
            </span>
          </div>
        </div>

        <div class="flex space-x-reverse space-x-4">
          <button type="submit"
                  [disabled]="form.invalid || loading"
                  class="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
            <span *ngIf="loading" class="inline-block animate-spin mr-2">⏳</span>
            {{ root ? 'حفظ التعديلات' : 'إضافة' }}
          </button>
          <button type="button"
                  (click)="onCancel()"
                  [disabled]="loading"
                  class="bg-red-100 hover:bg-red-200 text-red-700 px-6 py-2 rounded-lg transition disabled:opacity-50">
            إلغاء
          </button>
        </div>
      </form>
    </div>
  `
})
export class RootFormComponent implements OnInit, OnDestroy {
  @Input() root: Root | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form: FormGroup;
  loading = false;
  error = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private rootService: RootService
  ) {
    this.form = this.fb.group({
      letters: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]]
    });
  }

  ngOnInit() {
    console.log('📝 RootFormComponent initialized, root:', this.root);
    
    // Add the custom validator
    const lettersControl = this.form.get('letters');
    if (lettersControl) {
      lettersControl.setValidators([
        Validators.required, 
        Validators.minLength(3), 
        Validators.maxLength(3),
        this.rootExistsValidator.bind(this)
      ]);
      lettersControl.updateValueAndValidity();
    }
    
    if (this.root) {
      this.form.patchValue({
        letters: this.root.letters
      });
    }

    // Subscribe to loading and error states
    this.subscriptions.push(
      this.rootService.loading$.subscribe(loading => {
        this.loading = loading;
      })
    );
    
    this.subscriptions.push(
      this.rootService.error$.subscribe(error => {
        this.error = error || '';
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Custom validator to check if the root already exists
   */
  private rootExistsValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value || control.value.length !== 3) return null;
    
    const currentRoot = this.root?.letters;
    const newRoot = control.value;
    
    // Skip if we're editing and the value hasn't changed
    if (this.root && currentRoot === newRoot) return null;
    
    const existingRoot = this.rootService.getRootByLetters(newRoot);
    return existingRoot ? { rootExists: true } : null;
  }

  onSubmit() {
    console.log('📤 Form submission');
    
    if (this.form.valid) {
      if (this.root) {
        // Update an existing root
        const oldRoot = this.root.letters;
        const newRoot = this.form.value.letters;
        
        console.log('🔄 Update:', oldRoot, '→', newRoot);
        
        if (oldRoot !== newRoot) {
          this.rootService.updateRoot(oldRoot, newRoot).subscribe({
            next: (response) => {
              console.log('✅ Update successful:', response);
              if (response.success) {
                this.form.reset();
                this.saved.emit();
              }
            },
            error: (err) => {
              console.error('❌ Update error', err);
              // Error is already handled by the service and displayed via error$
            }
          });
        } else {
          console.log('ℹ️ No changes detected');
          this.form.reset();
          this.saved.emit();
        }
      } else {
        // Add a new root
        console.log('➕ Adding new root:', this.form.value.letters);
        
        this.rootService.addRoot({
          letters: this.form.value.letters
        }).subscribe({
          next: (response) => {
            console.log('✅ Root added successfully:', response);
            if (response.success) {
              this.form.reset();
              this.saved.emit();
            }
          },
          error: (err) => {
            console.error('❌ Add root error:', err);
            // Error is already handled by the service and displayed via error$
          }
        });
      }
    }
  }

  onCancel() {
    console.log('❌ Cancel operation');
    this.form.reset();
    this.cancelled.emit();
  }

  clearError() {
    this.rootService.clearError();
  }
}