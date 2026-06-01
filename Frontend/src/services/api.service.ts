// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, RootNodeDetails, GenerateRequest, GenerateResult, ValidationResult, LoadFileResult, Schema } from '../models/api.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8081/api'; // Adjust according to your configuration

  constructor(private http: HttpClient) {}

  /**
   * Get all roots
   * GET /api/roots
   */
  getAllRoots(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.baseUrl}/roots`);
  }

  /**
   * Get details of a specific root
   * GET /api/root?q={root}
   */
  getRootDetails(root: string): Observable<ApiResponse<RootNodeDetails>> {
    const params = new HttpParams().set('q', root);
    return this.http.get<ApiResponse<RootNodeDetails>>(`${this.baseUrl}/root`, { params });
  }

  /**
   * Generate derived words from a root and schemas
   * POST /api/generate
   */
  generateWords(request: GenerateRequest): Observable<ApiResponse<GenerateResult[]>> {
    return this.http.post<ApiResponse<GenerateResult[]>>(`${this.baseUrl}/generate`, request);
  }

  /**
   * Get all available schemas
   * GET /api/schemas
   */
  getAllSchemas(): Observable<ApiResponse<Schema[]>> {
    return this.http.get<ApiResponse<Schema[]>>(`${this.baseUrl}/schemas`);
  }

  /**
   * Add a new root
   * POST /api/add-root
   */
  addRoot(root: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/add-root`, { root });
  }

  /**
   * Add a new schema
   * POST /api/add-schema
   */
  addSchema(id: string, description: string = ''): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/add-schema`, { id, description });
  }

  /**
   * Modify an existing root
   * POST /api/modify-root
   */
  modifyRoot(oldRoot: string, newRoot: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/modify-root`, { 
      old: oldRoot, 
      new: newRoot 
    });
  }

  /**
   * Delete a root
   * POST /api/remove-root
   */
  removeRoot(root: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/remove-root`, { root });
  }

  /**
   * Modify schema description
   * POST /api/modify-schema
   */
  modifySchema(id: string, description: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/modify-schema`, { 
      id, 
      description 
    });
  }

  /**
   * Delete a schema
   * POST /api/remove-schema
   */
  removeSchema(id: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/remove-schema`, { id });
  }

  /**
   * Validate if a word belongs to a root
   * POST /api/validate
   */
  validateWord(word: string, root: string): Observable<ApiResponse<ValidationResult>> {
    return this.http.post<ApiResponse<ValidationResult>>(`${this.baseUrl}/validate`, { 
      word, 
      root 
    });
  }

  /**
   * Load roots from a file
   * POST /api/load-roots-from-file
   */
  loadRootsFromFile(filename: string): Observable<ApiResponse<LoadFileResult>> {
    return this.http.post<ApiResponse<LoadFileResult>>(`${this.baseUrl}/load-roots-from-file`, { 
      filename 
    });
  }

  /**
   * Check if the server is reachable
   */
  checkHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/roots`, { observe: 'response' });
  }
}