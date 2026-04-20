import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div
      class="min-h-svh bg-[#fafafa] bg-[linear-gradient(160deg,#fafafa_0%,#eef0f5_45%,#f5f3ff_100%)]"
    >
      <div
        class="mx-auto flex min-h-svh max-w-6xl flex-col items-center justify-center gap-10 px-4 py-10 md:flex-row md:items-stretch md:justify-between md:gap-16 md:py-16"
      >
        <section
          class="hidden max-w-md flex-1 flex-col justify-center md:flex md:pr-8"
          aria-hidden="true"
        >
          <div
            class="bg-linear-to-br from-[#f09433] via-[#e6683c] via-30% to-[#bc1888] bg-clip-text pb-2 font-semibold tracking-tight text-transparent"
            style="font-size: clamp(2.5rem, 5vw, 3.25rem); line-height: 1.1;"
          >
            Connect
          </div>
          <p class="mt-4 max-w-sm text-lg leading-snug text-[#262626]">
            Share moments, follow friends, and stay in touch — the feel of Instagram with the clarity and
            speed of Facebook.
          </p>
          <div
            class="mt-10 flex flex-wrap items-center gap-3 text-sm text-[#8e8e8e]"
          >
            <span class="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 shadow-sm ring-1 ring-black/5">
              <span class="size-2 rounded-full bg-[#1877f2]"></span>
              Feed
            </span>
            <span class="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 shadow-sm ring-1 ring-black/5">
              <span
                class="size-2 rounded-full bg-linear-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af]"
              ></span>
              Stories
            </span>
          </div>
        </section>

        <section class="w-full max-w-[400px] flex-1">
          <div
            class="rounded-2xl border border-black/8 bg-white px-8 py-10 shadow-[0_2px_24px_rgba(0,0,0,0.06)]"
          >
            <div
              class="mb-8 flex rounded-xl bg-[#f0f2f5] p-1 text-sm font-semibold text-[#65676b]"
              role="tablist"
            >
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="mode() === 'login'"
                class="flex-1 rounded-lg py-2.5 transition-colors"
                [class.bg-white]="mode() === 'login'"
                [class.text-[#1877f2]]="mode() === 'login'"
                [class.shadow-sm]="mode() === 'login'"
                (click)="setMode('login')"
              >
                Log in
              </button>
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="mode() === 'signup'"
                class="flex-1 rounded-lg py-2.5 transition-colors"
                [class.bg-white]="mode() === 'signup'"
                [class.text-[#1877f2]]="mode() === 'signup'"
                [class.shadow-sm]="mode() === 'signup'"
                (click)="setMode('signup')"
              >
                Sign up
              </button>
            </div>

            @if (errorMessage()) {
              <div
                class="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                role="alert"
              >
                {{ errorMessage() }}
              </div>
            }

            @if (mode() === 'login') {
              <form [formGroup]="loginForm" (ngSubmit)="submitLogin()" class="space-y-3">
                <label class="block text-xs font-semibold uppercase tracking-wide text-[#65676b]">
                  Email
                  <input
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    class="mt-1.5 w-full rounded-lg border border-[#ccd0d5] bg-[#f5f6f7] px-3 py-2.5 text-[15px] text-[#1c1e21] outline-none transition placeholder:text-[#8a8d91] focus:border-[#1877f2] focus:bg-white focus:ring-2 focus:ring-[#1877f2]/25"
                    placeholder="you@example.com"
                  />
                </label>
                <label class="block text-xs font-semibold uppercase tracking-wide text-[#65676b]">
                  Password
                  <input
                    type="password"
                    formControlName="password"
                    autocomplete="current-password"
                    class="mt-1.5 w-full rounded-lg border border-[#ccd0d5] bg-[#f5f6f7] px-3 py-2.5 text-[15px] text-[#1c1e21] outline-none transition focus:border-[#1877f2] focus:bg-white focus:ring-2 focus:ring-[#1877f2]/25"
                    placeholder="••••••••"
                  />
                </label>
                <button
                  type="submit"
                  [disabled]="loginForm.invalid || loading()"
                  class="mt-2 w-full rounded-lg bg-[#1877f2] py-2.5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {{ loading() ? 'Signing in…' : 'Log in' }}
                </button>
              </form>
            } @else {
              <form [formGroup]="signupForm" (ngSubmit)="submitSignup()" class="space-y-3">
                <label class="block text-xs font-semibold uppercase tracking-wide text-[#65676b]">
                  Full name
                  <input
                    type="text"
                    formControlName="name"
                    autocomplete="name"
                    class="mt-1.5 w-full rounded-lg border border-[#ccd0d5] bg-[#f5f6f7] px-3 py-2.5 text-[15px] outline-none focus:border-[#1877f2] focus:bg-white focus:ring-2 focus:ring-[#1877f2]/25"
                    placeholder="Your name"
                  />
                </label>
                <label class="block text-xs font-semibold uppercase tracking-wide text-[#65676b]">
                  Email
                  <input
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    class="mt-1.5 w-full rounded-lg border border-[#ccd0d5] bg-[#f5f6f7] px-3 py-2.5 text-[15px] outline-none focus:border-[#1877f2] focus:bg-white focus:ring-2 focus:ring-[#1877f2]/25"
                    placeholder="you@example.com"
                  />
                </label>
                <label class="block text-xs font-semibold uppercase tracking-wide text-[#65676b]">
                  Password
                  <input
                    type="password"
                    formControlName="password"
                    autocomplete="new-password"
                    class="mt-1.5 w-full rounded-lg border border-[#ccd0d5] bg-[#f5f6f7] px-3 py-2.5 text-[15px] outline-none focus:border-[#1877f2] focus:bg-white focus:ring-2 focus:ring-[#1877f2]/25"
                    placeholder="At least 6 characters"
                  />
                </label>
                <button
                  type="submit"
                  [disabled]="signupForm.invalid || loading()"
                  class="mt-2 w-full rounded-lg bg-[#1877f2] py-2.5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {{ loading() ? 'Creating account…' : 'Sign up' }}
                </button>
              </form>
            }

            <p class="mt-6 text-center text-xs text-[#8e8e8e]">
              Connects to the API Gateway — run services at
              <code class="rounded bg-[#f0f2f5] px-1 py-0.5 text-[11px]">{{ apiHint }}</code>
            </p>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly mode = signal<'login' | 'signup'>('login');
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly apiHint = environment.apiBaseUrl;

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly signupForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected setMode(m: 'login' | 'signup'): void {
    this.mode.set(m);
    this.errorMessage.set(null);
  }

  protected submitLogin(): void {
    if (this.loginForm.invalid) return;
    this.errorMessage.set(null);
    this.loading.set(true);
    const { email, password } = this.loginForm.getRawValue();
    this.auth
      .login(email, password)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.navigateAfterAuth(),
        error: (err) => this.errorMessage.set(this.formatError(err)),
      });
  }

  protected submitSignup(): void {
    if (this.signupForm.invalid) return;
    this.errorMessage.set(null);
    this.loading.set(true);
    const { name, email, password } = this.signupForm.getRawValue();
    this.auth
      .signup(name, email, password)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.navigateAfterAuth(),
        error: (err) => this.errorMessage.set(this.formatError(err)),
      });
  }

  private navigateAfterAuth(): void {
    const raw = this.route.snapshot.queryParamMap.get('returnUrl');
    const returnUrl =
      raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/home';
    void this.router.navigateByUrl(returnUrl);
  }

  private formatError(err: unknown): string {
    const http = err as HttpErrorResponse;
    if (http?.status === 0) {
      return (
        'Could not reach the server. Make sure the API Gateway is running at ' +
        environment.apiBaseUrl
      );
    }
    const body = http?.error;
    if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
      return body.message;
    }
    if (typeof http?.message === 'string' && http.message.length) {
      return http.message;
    }
    return 'Something went wrong. Please try again.';
  }
}
