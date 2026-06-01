// src/app/models/root.model.ts
import { GenerateResult, ValidationResult, LoadFileResult } from './api.model';

export interface Root {
  id: string;
  letters: string;
  meaning: string;
  createdAt: Date;
}

// Re-export API type
export { GenerateResult, ValidationResult, LoadFileResult };