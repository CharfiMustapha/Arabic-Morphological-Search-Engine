import { Routes } from '@angular/router';
import { DashboardComponent } from '../components/dashboard.component';
import { RootListComponent } from '../components/root-list.component';
import { SchemeListComponent } from '../components/scheme-list.component';
import { GenerationComponent } from '../components/generation.component';
import { ValidationComponent } from '../components/validation.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'roots', component: RootListComponent },
  { path: 'schemes', component: SchemeListComponent },
  { path: 'generate', component: GenerationComponent },
  { path: 'validate', component: ValidationComponent },
  { path: '**', redirectTo: '' }
];
