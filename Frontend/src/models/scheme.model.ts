// src/app/models/scheme.model.ts
import { Schema } from './api.model';

export interface Scheme {
  id: string;
  pattern: string;      // corresponds to the scheme id (e.g. "فاعل") - NOT MODIFIABLE
  name: string;         // scheme name (e.g. "active participle") - MODIFIABLE
  createdAt?: Date;
}

// Re-export API type
export interface ApiSchema extends Schema {}