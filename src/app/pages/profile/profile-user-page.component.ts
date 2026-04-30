import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { FriendshipsApi } from '../../core/api/friendships.api';
import { PostsApi } from '../../core/api/posts.api';
import { UsersApi } from '../../core/api/users.api';
import type { FriendshipStatus, PostDto, UserDto } from '../../core/api/api.models';

@Component({
  selector: 'app-profile-user-page',
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
              routerLink="/profile/me"
              class="rounded-full bg-[#f0f2f5] px-4 py-2 text-sm font-semibold text-[#1c1e21] hover:bg-[#e4e6eb]"
            >
              My profile
            </a>
            <a
              routerLink="/home"
              class="rounded-full bg-[#f0f2f5] px-4 py-2 text-sm font-semibold text-[#1c1e21] hover:bg-[#e4e6eb]"
            >
              Feed
            </a>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-6xl px-4 py-6">
        <section class="overflow-hidden rounded-2xl border border-black/6 bg-white">
          <div class="h-36 bg-[#fff1f2]"></div>
          <div class="px-4 pb-4">
            <div class="-mt-8 flex flex-wrap items-end justify-between gap-4">
              <div class="flex items-end gap-4">
                <div
                  class="size-20 rounded-full bg-linear-to-tr from-[#f09433] via-[#dd2a7b] to-[#515bd4] p-[3px]"
                >
                  <div class="size-full rounded-full bg-white"></div>
                </div>
                <div class="pb-1">
                  <div class="text-lg font-bold text-[#1c1e21]">
                    {{ userInfo()?.name || ('User #' + userId()) }}
                  </div>
                  <div class="text-sm text-[#65676b]">
                    {{ statusLabel() }}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2">
                @if (actionLabel()) {
                  <button
                    type="button"
                    (click)="performAction()"
                    [disabled]="actionBusy()"
                    class="rounded-xl bg-[#1877f2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:opacity-60"
                  >
                    {{ actionBusy() ? 'Working…' : actionLabel() }}
                  </button>
                }
              </div>
            </div>
          </div>
        </section>

        <section class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div class="space-y-4">
            <div class="rounded-2xl border border-black/6 bg-white p-4">
              <div class="text-sm font-semibold text-[#1c1e21]">Posts</div>
            </div>

            @if (loading()) {
              <div class="space-y-3">
                @for (_ of [0,1,2]; track _) {
                  <div class="rounded-2xl border border-black/6 bg-white p-4">
                    <div class="h-3 w-full rounded bg-[#f0f2f5]"></div>
                    <div class="mt-2 h-3 w-5/6 rounded bg-[#f0f2f5]"></div>
                  </div>
                }
              </div>
            } @else {
              @if (posts().length === 0) {
                <div class="rounded-2xl border border-black/6 bg-white p-8 text-center text-sm text-[#65676b]">
                  No posts yet.
                </div>
              }
              @for (p of posts(); track p.id) {
                <article class="rounded-2xl border border-black/6 bg-white p-4 shadow-[0_1px_10px_rgba(0,0,0,0.04)]">
                  <div class="text-xs text-[#65676b]">{{ formatDate(p.created_at) }}</div>
                  <p class="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-[#1c1e21]">
                    {{ p.content }}
                  </p>
                </article>
              }
            }
          </div>

          <aside class="hidden space-y-4 lg:block">
            <div class="rounded-2xl border border-black/6 bg-white p-4">
              <div class="text-sm font-semibold text-[#1c1e21]">About</div>
              <div class="mt-2 text-sm text-[#65676b]">
                {{ userInfo()?.email || '—' }}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  `,
})
export class ProfileUserPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly usersApi = inject(UsersApi);
  private readonly postsApi = inject(PostsApi);
  private readonly friendshipsApi = inject(FriendshipsApi);

  protected readonly loading = signal(true);
  protected readonly actionBusy = signal(false);
  protected readonly userInfo = signal<UserDto | null>(null);
  protected readonly posts = signal<PostDto[]>([]);
  protected readonly status = signal<FriendshipStatus>('NONE');

  protected readonly userId = signal<number>(0);
  protected readonly myId = computed(() => this.auth.user()?.id ?? 0);

  protected readonly statusLabel = computed(() => {
    const s = this.status();
    if (s === 'FRIENDS') return 'Friends';
    if (s === 'REQUEST_SENT') return 'Request sent';
    if (s === 'REQUEST_RECEIVED') return 'Requested you';
    if (s === 'BLOCKED_BY_ME') return 'Blocked';
    if (s === 'BLOCKED_BY_OTHER') return 'Unavailable';
    if (s === 'SELF') return 'You';
    return 'Not connected';
  });

  protected readonly actionLabel = computed(() => {
    const s = this.status();
    if (s === 'NONE') return 'Add friend';
    if (s === 'REQUEST_RECEIVED') return 'Accept request';
    if (s === 'REQUEST_SENT') return 'Cancel request';
    if (s === 'FRIENDS') return 'Block';
    if (s === 'BLOCKED_BY_ME') return 'Unblock';
    return null;
  });

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.userId.set(Number.isFinite(id) ? id : 0);
    this.load();
  }

  private load(): void {
    const id = this.userId();
    if (!id) return;
    this.loading.set(true);

    this.usersApi.getUserById(id).subscribe({
      next: (u) => this.userInfo.set(u),
      error: () => this.userInfo.set(null),
    });

    this.friendshipsApi.getStatus(id).subscribe({
      next: (s) => this.status.set(s.status),
      error: () => this.status.set('NONE'),
    });

    this.postsApi
      .getUserPosts(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (p) => this.posts.set(p),
        error: () => this.posts.set([]),
      });
  }

  protected performAction(): void {
    const targetId = this.userId();
    if (!targetId) return;
    const current = this.status();

    this.actionBusy.set(true);

    const done = () => {
      this.actionBusy.set(false);
      this.friendshipsApi.getStatus(targetId).subscribe({
        next: (s) => this.status.set(s.status),
        error: () => {},
      });
    };

    if (current === 'NONE') {
      this.friendshipsApi.sendRequest(targetId).subscribe({ next: done, error: done });
      return;
    }
    if (current === 'REQUEST_RECEIVED') {
      this.friendshipsApi.acceptRequest(targetId).subscribe({ next: done, error: done });
      return;
    }
    if (current === 'REQUEST_SENT') {
      this.friendshipsApi.cancelRequest(targetId).subscribe({ next: done, error: done });
      return;
    }
    if (current === 'FRIENDS') {
      this.friendshipsApi.blockUser(targetId).subscribe({ next: done, error: done });
      return;
    }
    if (current === 'BLOCKED_BY_ME') {
      this.friendshipsApi.unblockUser(targetId).subscribe({ next: done, error: done });
      return;
    }

    done();
  }

  protected formatDate(value: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric' });
  }
}

