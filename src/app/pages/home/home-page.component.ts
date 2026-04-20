import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-svh bg-[#fafafa]">
      <header
        class="sticky top-0 z-10 border-b border-black/8 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]"
      >
        <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div class="flex items-center gap-2">
            <span
              class="bg-linear-to-br from-[#f09433] via-[#e6683c] to-[#bc1888] bg-clip-text text-xl font-bold text-transparent"
            >
              Connect
            </span>
          </div>
          <div class="flex items-center gap-3">
            @if (user(); as u) {
              <span class="hidden text-sm text-[#65676b] sm:inline">
                ID {{ u.id }} · {{ u.role }}
              </span>
            }
            <button
              type="button"
              (click)="logout()"
              class="rounded-lg border border-[#ccd0d5] bg-white px-4 py-2 text-sm font-semibold text-[#1c1e21] transition hover:bg-[#f0f2f5]"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-2xl px-4 py-12 text-center">
        <div
          class="mx-auto max-w-md rounded-2xl border border-black/6 bg-white p-10 shadow-[0_2px_16px_rgba(0,0,0,0.04)]"
        >
          <div
            class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-linear-to-tr from-[#f09433] via-[#dd2a7b] to-[#515bd4] p-[2px]"
          >
            <div class="flex size-full items-center justify-center rounded-full bg-white text-2xl">
              ✓
            </div>
          </div>
          <h1 class="text-xl font-semibold text-[#262626]">Welcome</h1>
          <p class="mt-2 text-[15px] leading-relaxed text-[#65676b]">
            You are signed in and wired to the backend. Feed and posts are next on the roadmap.
          </p>
        </div>
      </main>
    </div>
  `,
})
export class HomePageComponent {
  private readonly auth = inject(AuthService);

  protected readonly user = this.auth.user;

  protected logout(): void {
    this.auth.logout();
  }
}
