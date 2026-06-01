// src/app/models/api.models.ts
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface RootNodeDetails {
  root: string;
  derivedWords: string[];
  frequencies: Record<string, number>;
}

export interface Schema {
  id: string;
  description: string;
}

export interface GenerateRequest {
  root: string;
  schemas: string[];
}

export interface GenerateResult {
  schema: string;
  status: 'success' | 'error';
  message?: string;
  generatedWord?: string;
  schemaDescription?: string;
}

export interface ValidationResult {
  word: string;
  root: string;
  isValid: boolean;
}

export interface LoadFileResult {
  filename: string;
  rootsBefore: number;
  rootsAfter: number;
  rootsAdded: number;
}

export interface ImportResult {
  title: string;
  message: string;
  successful: number;
  duplicates: number;
  errors: number;
  invalid: Array<{
    line: number;
    text: string;
    reason: string;
  }>;
}