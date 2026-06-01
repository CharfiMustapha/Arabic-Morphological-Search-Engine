// src/app/services/root.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { Root } from '../models/root.model';
import { ApiService } from './api.service';
import { ApiResponse, ImportResult } from '../models/api.model';

@Injectable({
  providedIn: 'root'
})
export class RootService {
  private rootsSubject = new BehaviorSubject<Root[]>([]);
  public roots$ = this.rootsSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadInitialRoots();
  }

  /**
   * Loads initial roots from the backend
   */
  private loadInitialRoots(): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    this.apiService.getAllRoots().subscribe({
      next: (response) => {
        if (response.success) {
          const roots = response.data.map((root: string, index: number) => this.mapToRoot(root, index));
          this.rootsSubject.next(roots);
        } else {
          this.errorSubject.next(response.message);
        }
        this.loadingSubject.next(false);
      },
      error: (error) => {
        console.error('Error while loading initial roots:', error);
        this.errorSubject.next('خطأ في الاتصال بالخادم');
        this.loadingSubject.next(false);
        this.rootsSubject.next([]);
      }
    });
  }

  /**
   * Maps a backend root string to our Root model
   */
  private mapToRoot(root: string, index: number): Root {
    return {
      id: `root-${Date.now()}-${index}-${Math.random()}`,
      letters: root,
      meaning: '',
      createdAt: new Date()
    };
  }

  /**
   * Refreshes the roots list from the backend
   */
  refreshRoots(): void {
    console.log('🔄 Refreshing roots...');
    this.loadingSubject.next(true);
    
    this.apiService.getAllRoots().subscribe({
      next: (response) => {
        console.log('✅ Roots received:', response);
        if (response.success) {
          const roots = response.data.map((root: string, index: number) => this.mapToRoot(root, index));
          this.rootsSubject.next(roots);
          this.errorSubject.next(null);
        } else {
          this.errorSubject.next(response.message);
        }
        this.loadingSubject.next(false);
      },
      error: (error) => {
        console.error('❌ Error while refreshing:', error);
        this.errorSubject.next('خطأ في الاتصال بالخادم');
        this.loadingSubject.next(false);
      }
    });
  }

  /**
   * Returns all roots (observable)
   */
  getRoots(): Observable<Root[]> {
    return this.roots$;
  }

  /**
   * Returns all roots (current value)
   */
  getAllRootsList(): Root[] {
    return this.rootsSubject.value;
  }

  /**
   * Gets a root by its ID
   */
  getRoot(id: string): Root | undefined {
    return this.rootsSubject.value.find(r => r.id === id);
  }

  /**
   * Gets a root by its letters
   */
  getRootByLetters(letters: string): Root | undefined {
    return this.rootsSubject.value.find(r => r.letters === letters);
  }

  /**
   * Centralized error handling
   */
  private handleError(error: any, operation: string): Observable<never> {
    console.error(`❌ Error during ${operation}:`, error);
    
    let errorMessage = '';
    
    // Check if it's a 400 Bad Request with a specific message
    if (error.status === 400) {
      // Try to extract error message from response
      if (error.error && typeof error.error === 'string') {
        // Backend returns a string message
        if (error.error.includes('exist') || error.error.includes('موجود')) {
          if (operation === 'ajout') {
            errorMessage = 'لا يمكن إضافة الجذر لأنه موجود بالفعل';
          } else {
            errorMessage = 'الجذر موجود بالفعل';
          }
        } else {
          errorMessage = error.error;
        }
      } else if (error.error && error.error.message) {
        // If the backend returns an object with message property
        if (error.error.message.includes('exist') || error.error.message.includes('موجود')) {
          if (operation === 'ajout') {
            errorMessage = 'لا يمكن إضافة الجذر لأنه موجود بالفعل';
          } else {
            errorMessage = 'الجذر موجود بالفعل';
          }
        } else {
          errorMessage = error.error.message;
        }
      } else {
        errorMessage = operation === 'ajout' 
          ? 'لا يمكن إضافة الجذر لأنه موجود بالفعل'
          : 'الجذر موجود بالفعل';
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
   * Adds a new root
   */
  addRoot(rootData: { letters: string, meaning?: string }): Observable<ApiResponse<string>> {
    console.log('📝 Adding root:', rootData);
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    return this.apiService.addRoot(rootData.letters).pipe(
      tap(response => {
        console.log('✅ Add response:', response);
        if (response.success) {
          setTimeout(() => {
            this.refreshRoots();
          }, 100);
        }
        this.loadingSubject.next(false);
      }),
      catchError(error => this.handleError(error, 'add'))
    );
  }

  /**
   * Updates a root
   */
  updateRoot(oldRoot: string, newRoot: string): Observable<ApiResponse<string>> {
    console.log('📝 Updating root:', oldRoot, '→', newRoot);
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    return this.apiService.modifyRoot(oldRoot, newRoot).pipe(
      tap(response => {
        console.log('✅ Update response:', response);
        if (response.success) {
          setTimeout(() => {
            this.refreshRoots();
          }, 100);
        }
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        // Custom message for update errors
        if (error.status === 400) {
          let errorMessage = '';
          if (error.error && typeof error.error === 'string') {
            if (error.error.includes('exist') || error.error.includes('موجود')) {
              errorMessage = `لا يمكن تعديل الجذر "${oldRoot}" لأن الجذر "${newRoot}" موجود بالفعل`;
            } else {
              errorMessage = error.error;
            }
          } else if (error.error && error.error.message) {
            if (error.error.message.includes('exist') || error.error.message.includes('موجود')) {
              errorMessage = `لا يمكن تعديل الجذر "${oldRoot}" لأن الجذر "${newRoot}" موجود بالفعل`;
            } else {
              errorMessage = error.error.message;
            }
          } else {
            errorMessage = `الجذر "${newRoot}" موجود بالفعل`;
          }
          
          this.loadingSubject.next(false);
          this.errorSubject.next(errorMessage);
          return throwError(() => error);
        }
        
        return this.handleError(error, 'update');
      })
    );
  }

  /**
   * Deletes a root
   */
  deleteRoot(root: string): Observable<ApiResponse<string>> {
    console.log('📝 Deleting root:', root);
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    return this.apiService.removeRoot(root).pipe(
      tap(response => {
        console.log('✅ Delete response:', response);
        if (response.success) {
          setTimeout(() => {
            this.refreshRoots();
          }, 100);
        }
        this.loadingSubject.next(false);
      }),
      catchError(error => this.handleError(error, 'delete'))
    );
  }

  /**
   * Imports roots from a file
   */
  importRoots(lines: string[]): ImportResult {
    console.log('📝 Importing roots:', lines.length, 'lines');
    
    const result: ImportResult = {
      title: 'نتائج الاستيراد',
      message: '',
      successful: 0,
      duplicates: 0,
      errors: 0,
      invalid: []
    };

    const validLines = lines.filter(line => line.trim().length > 0);
    const existingRootsSet = new Set(this.rootsSubject.value.map(r => r.letters));
    const newRoots: string[] = [];

    validLines.forEach((line, index) => {
      const trimmed = line.trim();

      if (!trimmed) return;

      if (trimmed.length !== 3) {
        result.errors++;
        result.invalid.push({
          line: index + 1,
          text: trimmed,
          reason: 'الجذر يجب أن يحتوي على 3 حروف بالضبط'
        });
        return;
      }

      if (existingRootsSet.has(trimmed)) {
        result.duplicates++;
        return;
      }

      newRoots.push(trimmed);
      existingRootsSet.add(trimmed);
      result.successful++;
    });

    result.message = `تم معالجة ${validLines.length} سطر من الملف`;

    // Add new roots
    if (result.successful > 0) {
      this.addMultipleRoots(newRoots).subscribe({
        next: () => {
          console.log('✅ Import completed, refreshing...');
          this.refreshRoots();
        },
        error: (err) => {
          console.error('❌ Import error:', err);
          result.errors = newRoots.length;
          result.successful = 0;
          result.message = 'فشل استيراد الجذور';
        }
      });
    }

    return result;
  }

  /**
   * Adds multiple roots (used by import) - Sequential version
   */
  private addMultipleRoots(roots: string[]): Observable<any> {
    if (roots.length === 0) {
      return new Observable<any>(observer => {
        observer.next(null);
        observer.complete();
      });
    }
    
    this.loadingSubject.next(true);
    
    // Add roots sequentially using switchMap
    let sequence = this.apiService.addRoot(roots[0]);
    
    for (let i = 1; i < roots.length; i++) {
      const root = roots[i];
      sequence = sequence.pipe(
        switchMap(() => this.apiService.addRoot(root))
      );
    }
    
    return sequence.pipe(
      tap(() => {
        console.log(`✅ ${roots.length} roots added successfully`);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('❌ Error while adding multiple roots:', error);
        this.loadingSubject.next(false);
        this.errorSubject.next(error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Clears the error
   */
  clearError(): void {
    this.errorSubject.next(null);
  }
}