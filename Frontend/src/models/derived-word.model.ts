// src/app/models/derived-word.model.ts
import { GenerateResult } from './api.model';

export interface DerivedWord {
  id: string;
  word: string;
  root: string;
  rootId?: string;        // ID of the root in our system
  scheme: string;
  schemeId?: string;      // ID of the scheme in our system
  schemeName?: string;    // Scheme name for display
  status: 'success' | 'error';
  message?: string;
  createdAt: Date;
}

// Interface for generation request
export interface GenerateRequest {
  root: string;            // Root letters
  schemas: string[];      // Scheme patterns
}

// Re-export API type
export { GenerateResult };