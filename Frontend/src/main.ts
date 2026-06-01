import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { NavbarComponent } from './components/navbar.component';
import { RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavbarComponent, RouterOutlet, HttpClientModule],
  
  template: `
    <div class="min-h-screen bg-gray-100">
      <app-navbar></app-navbar>
      <router-outlet></router-outlet>
    </div>
  `,
})
export class App {}

bootstrapApplication(App, {
  providers: [
    provideRouter(routes)
  ]
});
