import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="bg-white/20 backdrop-blur-md text-white shadow-lg fixed w-full">

      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-reverse space-x-4">
            <a routerLink="/" class="text-[#F0604D] text-2xl font-bold hover:text-[#F0604D] transition">
              محرك التصريف العربي
            </a>
          </div>

          <div class="hidden md:flex space-x-reverse space-x-4">
            <a routerLink="/" routerLinkActive="bg-[#CACACA]" [routerLinkActiveOptions]="{exact: true}"
               class="text-[#D74728] px-4 py-2 rounded-lg hover:bg-[#CACACA] transition">
              الرئيسية
            </a>
            <a routerLink="/roots" routerLinkActive="bg-[#CACACA]"
               class="text-[#D74728] px-4 py-2 rounded-lg hover:bg-[#CACACA] transition">
              الجذور
            </a>
            <a routerLink="/schemes" routerLinkActive="bg-[#CACACA]"
               class="text-[#D74728] px-4 py-2 rounded-lg hover:bg-[#CACACA] transition">
              الأوزان
            </a>
            <a routerLink="/generate" routerLinkActive="bg-[#CACACA]"
               class="text-[#D74728] px-4 py-2 rounded-lg hover:bg-[#CACACA] transition">
              التوليد
            </a>
            <a routerLink="/validate" routerLinkActive="bg-[#CACACA]"
               class="text-[#D74728] px-4 py-2 rounded-lg hover:bg-[#CACACA] transition">
              التحقق
            </a>
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {}