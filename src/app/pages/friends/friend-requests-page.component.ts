import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FriendshipsApi, FriendRequestDto } from '../../core/api/friendships.api';

@Component({
  selector: 'app-friend-requests-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-svh bg-[#fafafa]">
      <header class="sticky top-0 z-10 border-b border-black/8 bg-white">
        <div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <a
            routerLink="/home"
            class="bg-linear-to-br from-[#f09433] via-[#e6683c] to-[#bc1888] bg-clip-text text-xl font-bold text-transparent"
          >
            Connect
          </a>
          <div class="ml-auto flex items-center gap-2">
            <a
              routerLink="/home"
              class="rounded-full bg-[#f0f2f5] px-4 py-2 text-sm font-semibold text-[#1c1e21] hover:bg-[#e4e6eb]"
            >
              Feed
            </a>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-4xl px-4 py-6">
        <div class="rounded-2xl border border-black/6 bg-white p-4">
          <div class="flex items-center justify-between gap-3">
            <div class="text-base font-bold text-[#1c1e21]">Friend requests</div>
            <button
              type="button"
              class="rounded-xl bg-[#f0f2f5] px-3 py-2 text-sm font-semibold text-[#1c1e21] hover:bg-[#e4e6eb]"
              (click)="refresh()"
            >
              Refresh
            </button>
          </div>

          <div class="mt-4 flex rounded-xl bg-[#f0f2f5] p-1 text-sm font-semibold text-[#65676b]">
            <button
              type="button"
              class="flex-1 rounded-lg py-2.5 transition-colors"
              [class.bg-white]="tab() === 'received'"
              [class.text-[#1877f2]]="tab() === 'received'"
              [class.shadow-sm]="tab() === 'received'"
              (click)="tab.set('received')"
            >
              Received
              @if (receivedCount() > 0) {
                <span class="ml-2 rounded-full bg-[#f02849] px-2 py-0.5 text-xs text-white">
                  {{ receivedCount() }}
                </span>
              }
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg py-2.5 transition-colors"
              [class.bg-white]="tab() === 'sent'"
              [class.text-[#1877f2]]="tab() === 'sent'"
              [class.shadow-sm]="tab() === 'sent'"
              (click)="tab.set('sent')"
            >
              Sent
            </button>
          </div>

          <div class="mt-4 space-y-3">
            @if (loading()) {
              @for (_ of [0,1,2]; track _) {
                <div class="rounded-xl border border-black/5 p-3">
                  <div class="h-4 w-48 rounded bg-[#f0f2f5]"></div>
                  <div class="mt-3 h-9 w-full rounded bg-[#f0f2f5]"></div>
                </div>
              }
            } @else {
              @if (current().length === 0) {
                <div class="rounded-xl border border-black/5 p-6 text-center text-sm text-[#65676b]">
                  Nothing here.
                </div>
              }

              @for (r of current(); track r.userId) {
                <div class="rounded-xl border border-black/5 p-3">
                  <div class="flex items-center gap-3">
                    <div class="size-12 rounded-full bg-[#f0f2f5]"></div>
                    <div class="min-w-0 flex-1">
                      <a
                        class="block truncate text-sm font-semibold text-[#1c1e21] hover:underline"
                        [routerLink]="['/profile', r.userId]"
                      >
                        {{ r.name || ('User #' + r.userId) }}
                      </a>
                      <div class="text-xs text-[#65676b]">
                        @if (tab() === 'received') { sent you a request } @else { pending request }
                      </div>
                    </div>
                    @if (tab() === 'received') {
                      <div class="flex gap-2">
                        <button
                          type="button"
                          (click)="accept(r.userId)"
                          [disabled]="busy()[r.userId]"
                          class="rounded-xl bg-[#1877f2] px-3 py-2 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:opacity-60"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          (click)="reject(r.userId)"
                          [disabled]="busy()[r.userId]"
                          class="rounded-xl bg-[#f0f2f5] px-3 py-2 text-sm font-semibold text-[#1c1e21] hover:bg-[#e4e6eb] disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    } @else {
                      <button
                        type="button"
                        (click)="cancel(r.userId)"
                        [disabled]="busy()[r.userId]"
                        class="rounded-xl bg-[#f0f2f5] px-3 py-2 text-sm font-semibold text-[#1c1e21] hover:bg-[#e4e6eb] disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    }
                  </div>
                </div>
              }
            }
          </div>
        </div>
      </main>
    </div>
  `,
})
export class FriendRequestsPageComponent {
  private readonly friendshipsApi = inject(FriendshipsApi);

  protected readonly tab = signal<'received' | 'sent'>('received');
  protected readonly loading = signal(true);
  protected readonly received = signal<FriendRequestDto[]>([]);
  protected readonly sent = signal<FriendRequestDto[]>([]);
  protected readonly busy = signal<Record<number, boolean>>({});

  protected readonly receivedCount = computed(() => this.received().length);
  protected readonly current = computed(() =>
    this.tab() === 'received' ? this.received() : this.sent(),
  );

  constructor() {
    this.refresh();
  }

  protected refresh(): void {
    this.loading.set(true);
    this.friendshipsApi.getRequests('received').subscribe({
      next: (r) => this.received.set(r),
      error: () => this.received.set([]),
    });
    this.friendshipsApi.getRequests('sent').subscribe({
      next: (r) => this.sent.set(r),
      error: () => this.sent.set([]),
      complete: () => this.loading.set(false),
    });
  }

  protected accept(userId: number): void {
    this.setBusy(userId, true);
    this.friendshipsApi.acceptRequest(userId).subscribe({
      next: () => this.afterAction(userId),
      error: () => this.afterAction(userId),
    });
  }

  protected reject(userId: number): void {
    this.setBusy(userId, true);
    this.friendshipsApi.rejectRequest(userId).subscribe({
      next: () => this.afterAction(userId),
      error: () => this.afterAction(userId),
    });
  }

  protected cancel(userId: number): void {
    this.setBusy(userId, true);
    this.friendshipsApi.cancelRequest(userId).subscribe({
      next: () => this.afterAction(userId),
      error: () => this.afterAction(userId),
    });
  }

  private afterAction(userId: number): void {
    this.setBusy(userId, false);
    this.refresh();
  }

  private setBusy(userId: number, v: boolean): void {
    const next = { ...this.busy() };
    next[userId] = v;
    this.busy.set(next);
  }
}

