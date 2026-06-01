// src/app/services/scheme.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { Scheme } from '../models/scheme.model';
import { ApiService } from './api.service';
import { ApiResponse, ImportResult } from '../models/api.model';

@Injectable({
  providedIn: 'root'
})
export class SchemeService {
  private schemesSubject = new BehaviorSubject<Scheme[]>([]);
  public schemes$ = this.schemesSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadInitialSchemes();
  }

  /**
   * Loads initial schemes from the backend
   */
  private loadInitialSchemes(): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    this.apiService.getAllSchemas().subscribe({
      next: (response) => {
        if (response.success) {
          const schemes = response.data.map((schema: any, index: number) => 
            this.mapToScheme(schema, index)
          );
          this.schemesSubject.next(schemes);
        } else {
          this.errorSubject.next(response.message);
        }
        this.loadingSubject.next(false);
      },
      error: (error) => {
        console.error('Error while loading initial schemes:', error);
        this.errorSubject.next('خطأ في الاتصال بالخادم');
        this.loadingSubject.next(false);
        this.schemesSubject.next([]);
      }
    });
  }

  /**
   * Maps a backend scheme to our Scheme model
   * For existing schemes, we keep the backend name if it exists
   */
  private mapToScheme(schema: any, index: number): Scheme {
    return {
      id: `scheme-${Date.now()}-${index}-${Math.random()}`,
      pattern: schema.id,       
      name: schema.description || this.getDefaultName(schema.id),
      createdAt: new Date()
    };
  }

  /**
   * Generates a default name based on pattern (only for new schemes)
   */
  private getDefaultName(pattern: string): string {
    const nameMap: { [key: string]: string } = {
      'فاعل': 'اسم الفاعل',
      'مفعول': 'اسم المفعول',
      'فعال': 'اسم الفعالية',
      'فعل': 'الفعل المجرد',
      'افتعل': 'الفعل المزيد'
    };
    return nameMap[pattern] || `وزن ${pattern}`;
  }

  /**
   * Refreshes schemes list from backend
   */
  refreshSchemes(): void {
    console.log('🔄 Refreshing schemes...');
    this.loadingSubject.next(true);
    
    this.apiService.getAllSchemas().subscribe({
      next: (response) => {
        console.log('✅ Schemes received:', response);
        if (response.success) {
          const schemes = response.data.map((schema: any, index: number) => 
            this.mapToScheme(schema, index)
          );
          this.schemesSubject.next(schemes);
          this.errorSubject.next(null);
        } else {
          this.errorSubject.next(response.message);
        }
        this.loadingSubject.next(false);
      },
      error: (error) => {
        console.error('❌ Error while refreshing schemes:', error);
        this.errorSubject.next('خطأ في الاتصال بالخادم');
        this.loadingSubject.next(false);
      }
    });
  }

  /**
   * Gets all schemes (observable)
   */
  getSchemes(): Observable<Scheme[]> {
    return this.schemes$;
  }

  /**
   * Gets all schemes (direct value)
   */
  getAllSchemesList(): Scheme[] {
    return this.schemesSubject.value;
  }

  /**
   * Gets a scheme by ID
   */
  getScheme(id: string): Scheme | undefined {
    return this.schemesSubject.value.find(s => s.id === id);
  }

  /**
   * Gets a scheme by pattern
   */
  getSchemeByPattern(pattern: string): Scheme | undefined {
    return this.schemesSubject.value.find(s => s.pattern === pattern);
  }

  /**
   * Centralized error handling
   */
  private handleError(error: any, operation: string): Observable<never> {
    console.error(`❌ Error ${operation}:`, error);
    
    let errorMessage = '';
    
    if (error.status === 400) {
      if (error.error && typeof error.error === 'string') {
        if (error.error.includes('exist') || error.error.includes('موجود')) {
          if (operation === 'ajout') {
            errorMessage = 'لا يمكن إضافة الوزن لأنه موجود بالفعل';
          } else {
            errorMessage = 'الوزن موجود بالفعل';
          }
        } else {
          errorMessage = error.error;
        }
      } else if (error.error && error.error.message) {
        if (error.error.message.includes('exist') || error.error.message.includes('موجود')) {
          if (operation === 'ajout') {
            errorMessage = 'لا يمكن إضافة الوزن لأنه موجود بالفعل';
          } else {
            errorMessage = 'الوزن موجود بالفعل';
          }
        } else {
          errorMessage = error.error.message;
        }
      } else {
        errorMessage = operation === 'ajout' 
          ? 'لا يمكن إضافة الوزن لأنه موجود بالفعل'
          : 'الوزن موجود بالفعل';
      }
    } else if (error.status === 0) {
      errorMessage = 'خطأ في الاتصال بالخادم';
    } else {
      errorMessage = error.message || 'حدث خطأ غير متوقع';
    }
    
    this.loadingSubject.next(false);
    this.errorSubject.next(errorMessage);
    return throwError(() => error);
  }

  /**
   * Adds a new scheme
   */
  addScheme(schemeData: { pattern: string, name: string }): Observable<ApiResponse<string>> {
    console.log('📝 Adding scheme:', schemeData);
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    // Le backend attend { id, description }
    // On envoie le nom comme description
    return this.apiService.addSchema(schemeData.pattern, schemeData.name).pipe(
      tap(response => {
        console.log('✅ Add response:', response);
        if (response.success) {
          setTimeout(() => {
            this.refreshSchemes();
          }, 100);
        }
        this.loadingSubject.next(false);
      }),
      catchError(error => this.handleError(error, 'add'))
    );
  }

  /**
   * Updates a scheme (only name is editable)
   */
  updateScheme(id: string, schemeData: { name: string }): Observable<ApiResponse<string>> {
    console.log('📝 Updating scheme:', id, '→ new name:', schemeData.name);
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    const scheme = this.getScheme(id);
    if (!scheme) {
      this.loadingSubject.next(false);
      this.errorSubject.next('الوزن غير موجود');
      return throwError(() => new Error('Scheme not found'));
    }
    
    // Le backend attend { id, description } - on met à jour la description avec le nouveau nom
    return this.apiService.modifySchema(scheme.pattern, schemeData.name).pipe(
      tap(response => {
        console.log('✅ Update response:', response);
        if (response.success) {
          setTimeout(() => {
            this.refreshSchemes();
          }, 100);
        }
        this.loadingSubject.next(false);
      }),
      catchError(error => this.handleError(error, 'update'))
    );
  }

  /**
   * Deletes a scheme
   */
  deleteScheme(pattern: string): Observable<ApiResponse<string>> {
    console.log('📝 Deleting scheme:', pattern);
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    return this.apiService.removeSchema(pattern).pipe(
      tap(response => {
        console.log('✅ Delete response:', response);
        if (response.success) {
          setTimeout(() => {
            this.refreshSchemes();
          }, 100);
        }
        this.loadingSubject.next(false);
      }),
      catchError(error => this.handleError(error, 'delete'))
    );
  }

  /**
   * Imports schemes from file
   */
  importSchemes(lines: string[]): ImportResult {
    console.log('📝 Importing schemes:', lines.length, 'lines');
    
    const result: ImportResult = {
      title: 'نتائج الاستيراد',
      message: '',
      successful: 0,
      duplicates: 0,
      errors: 0,
      invalid: []
    };

    const validLines = lines.filter(line => line.trim().length > 0);
    const existingSchemesSet = new Set(this.schemesSubject.value.map(s => s.pattern));
    const newSchemes: Array<{pattern: string, name: string}> = [];

    validLines.forEach((line, index) => {
      const trimmed = line.trim();
      
      const parts = trimmed.split('|');
      const pattern = parts[0].trim();

      if (!pattern) return;

      if (pattern.length > 20) {
        result.errors++;
        result.invalid.push({
          line: index + 1,
          text: trimmed,
          reason: 'الوزن طويل جداً'
        });
        return;
      }

      if (existingSchemesSet.has(pattern)) {
        result.duplicates++;
        return;
      }

      const name = parts.length > 1 ? parts[1].trim() : this.getDefaultName(pattern);

      newSchemes.push({ pattern, name });
      existingSchemesSet.add(pattern);
      result.successful++;
    });

    result.message = `تم معالجة ${validLines.length} سطر من الملف`;

    if (result.successful > 0) {
      this.addMultipleSchemes(newSchemes).subscribe({
        next: () => {
          console.log('✅ Import completed, refreshing...');
          this.refreshSchemes();
        },
        error: (err) => {
          console.error('❌ Import error:', err);
          result.errors = newSchemes.length;
          result.successful = 0;
          result.message = 'فشل استيراد الأوزان';
        }
      });
    }

    return result;
  }

  /**
   * Adds multiple schemes (used by import)
   */
  private addMultipleSchemes(schemes: Array<{pattern: string, name: string}>): Observable<any> {
    if (schemes.length === 0) {
      return new Observable<any>(observer => {
        observer.next(null);
        observer.complete();
      });
    }
    
    this.loadingSubject.next(true);
    
    let sequence = this.apiService.addSchema(schemes[0].pattern, schemes[0].name);
    
    for (let i = 1; i < schemes.length; i++) {
      const scheme = schemes[i];
      sequence = sequence.pipe(
        switchMap(() => this.apiService.addSchema(scheme.pattern, scheme.name))
      );
    }
    
    return sequence.pipe(
      tap(() => {
        console.log(`✅ ${schemes.length} schemes added successfully`);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('❌ Error while adding multiple schemes:', error);
        this.loadingSubject.next(false);
        this.errorSubject.next(error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Clears error
   */
  clearError(): void {
    this.errorSubject.next(null);
  }
}