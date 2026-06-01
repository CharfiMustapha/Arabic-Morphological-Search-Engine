import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RootService } from '../services/root.service';
import { SchemeService } from '../services/scheme.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="pt-16 container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold text-gray-800 mb-4">
            محرك التصريف المورفولوجي العربي
          </h1>
          <p class="text-xl text-gray-600">
            منصة متكاملة لتوليد والتحقق من الكلمات العربية المشتقة
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-6 mb-12">
          <div class="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#058c42]">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-2xl font-bold text-gray-800">الجذور</h3>
              <span class="text-3xl font-bold text-[#058c42]">{{ rootCount }}</span>
            </div>
            <p class="text-gray-600 mb-4">إدارة الجذور اللغوية العربية</p>
            <a routerLink="/roots"
               class="inline-block bg-[#058c42] hover:bg-[#058c42] text-white px-6 py-2 rounded-lg transition">
              إدارة الجذور
            </a>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#FFB116]">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-2xl font-bold text-gray-800">الأوزان</h3>
              <span class="text-3xl font-bold text-[#FFB116]">{{ schemeCount }}</span>
            </div>
            <p class="text-gray-600 mb-4">إدارة الأوزان الصرفية</p>
            <a routerLink="/schemes"
               class="inline-block bg-[#FFB116] hover:bg-[#FFB116] text-white px-6 py-2 rounded-lg transition">
              إدارة الأوزان
            </a>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="mb-4">
              <svg class="w-12 h-12 text-[#FFA29A] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              <h3 class="text-2xl font-bold text-gray-800">التوليد المورفولوجي</h3>
            </div>
            <p class="text-gray-700 mb-4">
              قم بتوليد الكلمات المشتقة من الجذور والأوزان
            </p>
            <a routerLink="/generate"
               class="inline-block bg-[#FFA29A] hover:bg-[#FFA29A] text-white px-6 py-2 rounded-lg transition">
              ابدأ التوليد
            </a>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="mb-4">
              <svg class="w-12 h-12 text-[#28a8b8] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <h3 class="text-2xl font-bold text-gray-800">التحقق المورفولوجي</h3>
            </div>
            <p class="text-gray-700 mb-4">
              تحقق من صحة الكلمات واكتشف الجذر والوزن
            </p>
            <a routerLink="/validate"
               class="inline-block bg-[#28a8b8] hover:bg-[#28a8b8] text-white px-6 py-2 rounded-lg transition">
              بدء التحقق
            </a>
          </div>
        </div>
        <div class="border-r-4 border-[#D74728] rounded-lg ">
        <div class="mt-12 bg-[#FDF0E7] rounded-lg p-6">
          <h3 class="text-xl font-bold text-[#D74728] mb-4">عن المشروع</h3>
          <p class="text-gray-700 leading-relaxed">
            محرك التصريف المورفولوجي العربي هو أداة تفاعلية تتيح لك استكشاف بنية الكلمات العربية.
            يمكنك إدارة الجذور والأوزان، توليد كلمات مشتقة جديدة، والتحقق من صحة الكلمات العربية
            بناءً على القواعد الصرفية.
          </p>
        </div>
      </div>
    </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  rootCount = 0;
  schemeCount = 0;

  constructor(
    private rootService: RootService,
    private schemeService: SchemeService
  ) {}

  ngOnInit() {
    this.rootService.roots$.subscribe(roots => {
      this.rootCount = roots.length;
    });

    this.schemeService.schemes$.subscribe(schemes => {
      this.schemeCount = schemes.length;
    });
  }
}
