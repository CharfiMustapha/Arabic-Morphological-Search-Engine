// src/app/services/morphology.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, lastValueFrom } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { DerivedWord, GenerateRequest } from '../models/derived-word.model';
import { ApiService } from './api.service';
import { RootService } from './root.service';
import { SchemeService } from './scheme.service';
import { ApiResponse } from '../models/api.model';
import { Scheme } from '../models/scheme.model';

@Injectable({
  providedIn: 'root'
})
export class MorphologyService {
  private generatedWordsSubject = new BehaviorSubject<DerivedWord[]>([]);
  public generatedWords$ = this.generatedWordsSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  // Counter to track completed requests
  private completedRequests = 0;
  private totalRequests = 0;
  private allResults: DerivedWord[] = [];

  constructor(
    private apiService: ApiService,
    private rootService: RootService,
    private schemeService: SchemeService
  ) {}

  /**
   * Generates derived words from a root and multiple schemes
   * Sends one request per scheme to the backend (sequential version)
   */
  generateWords(rootId: string, schemeIds: string[]): void {
    console.log('🔤 Word generation:', { rootId, schemeIds });
    
    // Get the root
    const root = this.rootService.getRoot(rootId);
    if (!root) {
      this.errorSubject.next('الرجاء اختيار جذر صحيح');
      return;
    }

    // Get selected schemes
    const selectedSchemes = schemeIds
      .map(id => this.schemeService.getScheme(id))
      .filter((scheme): scheme is Scheme => scheme !== undefined);

    if (selectedSchemes.length === 0) {
      this.errorSubject.next('الرجاء اختيار وزن واحد على الأقل');
      return;
    }

    // Initialize states
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    this.generatedWordsSubject.next([]); // Vider les résultats précédents
    
    this.completedRequests = 0;
    this.totalRequests = selectedSchemes.length;
    this.allResults = [];

    console.log(`📡 Sending  ${this.totalRequests} request(s) to backend...`);

    // Send one request per scheme
    selectedSchemes.forEach((scheme, index) => {
      const request = {
        root: root.letters,
        schemas: [scheme.pattern]
      };

      console.log(`📡 Request ${index + 1}/${this.totalRequests}:`, scheme.pattern);

      this.apiService.generateWords(request).subscribe({
        next: (response: ApiResponse<any[]>) => {
          console.log(`✅ Response for ${scheme.pattern}:`, response);
          
          const wordsFromThisRequest = this.mapResponseToDerivedWords(
            response, 
            root, 
            scheme,
            index
          );
          
          this.allResults = [...this.allResults, ...wordsFromThisRequest];
          
          this.generatedWordsSubject.next([...this.allResults]);
          
          this.completedRequests++;
          
          if (this.completedRequests === this.totalRequests) {
            console.log('✅ All requests completed');
            this.loadingSubject.next(false);
            
            this.sortResultsBySchemeOrder(selectedSchemes);
          }
        },
        error: (error) => {
          console.error(`❌ Error for ${scheme.pattern}:`, error);
          
          const errorWord = this.createErrorEntry(root, scheme, error, index);
          this.allResults.push(errorWord);
          
          this.generatedWordsSubject.next([...this.allResults]);
          
          this.completedRequests++;
          
          if (this.completedRequests === this.totalRequests) {
            console.log('✅ All requests completed (with errors)');
            this.loadingSubject.next(false);
            
            if (this.allResults.every(r => r.status === 'error')) {
              this.errorSubject.next('فشلت جميع محاولات التوليد');
            }
          }
        }
      });
    });
  }

  /**
   * Parallel version using Promise.all
   */
  async generateWordsParallel(rootId: string, schemeIds: string[]): Promise<void> {
    console.log('🔤 Word generation (parallel):', { rootId, schemeIds });
    
    const root = this.rootService.getRoot(rootId);
    if (!root) {
      this.errorSubject.next('الرجاء اختيار جذر صحيح');
      return;
    }

    const selectedSchemes = schemeIds
      .map(id => this.schemeService.getScheme(id))
      .filter((scheme): scheme is Scheme => scheme !== undefined);

    if (selectedSchemes.length === 0) {
      this.errorSubject.next('الرجاء اختيار وزن واحد على الأقل');
      return;
    }

    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    this.generatedWordsSubject.next([]);
    this.allResults = [];
    this.totalRequests = selectedSchemes.length;
    this.completedRequests = 0;

    try {
      const promises = selectedSchemes.map(async (scheme, index) => {
        const request = {
          root: root.letters,
          schemas: [scheme.pattern]
        };

        try {
          const response = await lastValueFrom(this.apiService.generateWords(request));
          
          if (response) {
            return this.mapResponseToDerivedWords(response, root, scheme, index);
          } else {
            console.warn(`⚠️ Empty response for ${scheme.pattern}`);
            return [this.createErrorEntry(root, scheme, new Error('Empty response'), index)];
          }
        } catch (error) {
          console.error(`❌ Error for ${scheme.pattern}:`, error);
          return [this.createErrorEntry(root, scheme, error, index)];
        }
      });

      const resultsArrays = await Promise.all(promises);
      
      this.allResults = resultsArrays.flat();
      
      this.sortResultsBySchemeOrder(selectedSchemes);
      
      this.generatedWordsSubject.next([...this.allResults]);
      
    } catch (error) {
      console.error('❌ Global error:', error);
      this.errorSubject.next('حدث خطأ أثناء التوليد');
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Alternative version using forkJoin
   */
  generateWordsWithForkJoin(rootId: string, schemeIds: string[]): void {
    console.log('🔤 Word generation (forkJoin):', { rootId, schemeIds });
    
    const root = this.rootService.getRoot(rootId);
    if (!root) {
      this.errorSubject.next('الرجاء اختيار جذر صحيح');
      return;
    }

    const selectedSchemes = schemeIds
      .map(id => this.schemeService.getScheme(id))
      .filter((scheme): scheme is Scheme => scheme !== undefined);

    if (selectedSchemes.length === 0) {
      this.errorSubject.next('الرجاء اختيار وزن واحد على الأقل');
      return;
    }

    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    this.generatedWordsSubject.next([]);
    this.allResults = [];
    this.totalRequests = selectedSchemes.length;
    this.completedRequests = 0;

    const observables = selectedSchemes.map((scheme, index) => {
      const request = {
        root: root.letters,
        schemas: [scheme.pattern]
      };

      return this.apiService.generateWords(request).pipe(
        catchError(error => {
          console.error(`❌ Error for ${scheme.pattern}:`, error);
          return [{
            success: false,
            message: error.message || 'Unknown error',
            data: []
          }];
        })
      );
    });

    import('rxjs').then(({ forkJoin }) => {
      forkJoin(observables).subscribe({
        next: (responses: ApiResponse<any[]>[]) => {
          responses.forEach((response, index) => {
            const scheme = selectedSchemes[index];
            const wordsFromThisRequest = this.mapResponseToDerivedWords(
              response, 
              root, 
              scheme,
              index
            );
            this.allResults = [...this.allResults, ...wordsFromThisRequest];
          });

          this.sortResultsBySchemeOrder(selectedSchemes);
          this.generatedWordsSubject.next([...this.allResults]);
          this.loadingSubject.next(false);
        },
        error: (error) => {
          console.error('❌ Error forkJoin:', error);
          this.errorSubject.next('حدث خطأ أثناء التوليد');
          this.loadingSubject.next(false);
        }
      });
    });
  }

  /**
   * Maps API response to DerivedWord model
   */
  private mapResponseToDerivedWords(
    response: ApiResponse<any[]>, 
    root: any, 
    scheme: any,
    requestIndex: number
  ): DerivedWord[] {
    const words: DerivedWord[] = [];

    if (response && response.success && response.data && response.data.length > 0) {
      response.data.forEach((item, idx) => {
        const status: 'success' | 'error' = item?.status === 'success' ? 'success' : 'error';
        
        if (status === 'success' && item?.generatedWord) {
          words.push({
            id: `word-${Date.now()}-${requestIndex}-${idx}-${Math.random()}`,
            word: item.generatedWord,
            root: root.letters,
            rootId: root.id,
            scheme: item?.schema || scheme.pattern,
            schemeId: scheme.id,
            schemeName: scheme.name,
            status: 'success',
            message: item?.message,
            createdAt: new Date()
          });
        } else {
          words.push({
            id: `word-${Date.now()}-${requestIndex}-${idx}-${Math.random()}`,
            word: '',
            root: root.letters,
            rootId: root.id,
            scheme: item?.schema || scheme.pattern,
            schemeId: scheme.id,
            schemeName: scheme.name,
            status: 'error',
            message: item?.message || 'فشل في توليد الكلمة',
            createdAt: new Date()
          });
        }
      });
    } else {
      words.push({
        id: `word-${Date.now()}-${requestIndex}-0-${Math.random()}`,
        word: '',
        root: root.letters,
        rootId: root.id,
        scheme: scheme.pattern,
        schemeId: scheme.id,
        schemeName: scheme.name,
        status: 'error',
        message: response?.message || 'لم يتم توليد أي كلمات',
        createdAt: new Date()
      });
    }

    return words;
  }

  /**
   * Creates an error entry for a failed scheme request
   */
  private createErrorEntry(root: any, scheme: any, error: any, requestIndex: number): DerivedWord {
    let errorMessage = '';
    
    if (error?.error && typeof error.error === 'string') {
      errorMessage = error.error;
    } else if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    } else {
      errorMessage = 'فشل في توليد الكلمة';
    }

    return {
      id: `error-${Date.now()}-${requestIndex}-${Math.random()}`,
      word: '',
      root: root.letters,
      rootId: root.id,
      scheme: scheme.pattern,
      schemeId: scheme.id,
      schemeName: scheme.name,
      status: 'error',
      message: errorMessage,
      createdAt: new Date()
    };
  }

  /**
   * Sort results based on selected scheme order
   */
  private sortResultsBySchemeOrder(selectedSchemes: any[]): void {
    const currentResults = this.generatedWordsSubject.value;
    
    const resultsByScheme = new Map();
    currentResults.forEach(result => {
      const key = result.scheme;
      if (!resultsByScheme.has(key)) {
        resultsByScheme.set(key, []);
      }
      resultsByScheme.get(key).push(result);
    });

    const sortedResults: DerivedWord[] = [];
    selectedSchemes.forEach(scheme => {
      const schemeResults = resultsByScheme.get(scheme.pattern) || [];
      sortedResults.push(...schemeResults);
    });

    this.generatedWordsSubject.next(sortedResults);
  }

  /**
   * Returns generated words observable
   */
  getGeneratedWords(): Observable<DerivedWord[]> {
    return this.generatedWords$;
  }

  /**
   * Returns current generated words value
   */
  getAllGeneratedWords(): DerivedWord[] {
    return this.generatedWordsSubject.value;
  }

  /**
   * Clears generated words
   */
  clearGeneratedWords(): void {
    this.generatedWordsSubject.next([]);
    this.completedRequests = 0;
    this.totalRequests = 0;
    this.allResults = [];
  }

  /**
   * Centralized error handler
   */
  private handleError(error: any, operation: string): void {
    console.error(`❌ Error in ${operation}:`, error);
    
    let errorMessage = '';
    
    if (error?.status === 400) {
      if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = 'بيانات غير صحيحة';
      }
    } else if (error?.status === 0) {
      errorMessage = 'خطأ في الاتصال بالخادم';
    } else {
      errorMessage = error?.message || 'حدث خطأ غير متوقع';
    }
    
    this.errorSubject.next(errorMessage);
  }

  /**
   * Clears error state
   */
  clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Validates if a word belongs to a root
   */
  validateWord(word: string, rootLetters: string): Observable<ApiResponse<any>> {
    console.log('✅ Validating word:', { word, root: rootLetters });
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    return this.apiService.validateWord(word, rootLetters).pipe(
      tap(response => {
        console.log('✅ Validation response:', response);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('❌ Validation error:', error);
        this.handleError(error, 'validation');
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Returns generation progress (completed / total)
   */
  getProgress(): { completed: number, total: number } {
    return {
      completed: this.completedRequests,
      total: this.totalRequests
    };
  }
}