import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { FriendshipsApi } from '../../core/api/friendships.api';
import { PostsApi } from '../../core/api/posts.api';
import { UsersApi } from '../../core/api/users.api';
import type { PostDto, UserDto } from '../../core/api/api.models';

type ViewPost = PostDto & { author?: UserDto | null };

@Component({
  selector: 'app-feed-page',
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

          <div class="hidden flex-1 sm:block">
            <div
              class="flex items-center gap-2 rounded-full bg-[#f0f2f5] px-4 py-2 text-sm text-[#65676b]"
            >
              <span class="text-[#8a8d91]">Search</span>
              <span class="ml-auto text-xs text-[#8a8d91]">Ctrl K</span>
            </div>
          </div>

          <div class="ml-auto flex items-center gap-2">
            <a
              routerLink="/profile/me"
              class="rounded-full bg-[#f0f2f5] px-3 py-2 text-sm font-semibold text-[#1c1e21] hover:bg-[#e4e6eb]"
            >
              My profile
            </a>
            <button
              type="button"
              (click)="logout()"
              class="rounded-full bg-[#1877f2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#166fe5]"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main class="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_360px]">
        <section class="space-y-4">
          <div class="rounded-2xl border border-black/6 bg-white p-4 shadow-[0_1px_12px_rgba(0,0,0,0.05)]">
            <div class="flex items-start gap-3">
              <div
                class="size-10 rounded-full bg-linear-to-tr from-[#f09433] via-[#dd2a7b] to-[#515bd4] p-[2px]"
              >
                <div class="size-full rounded-full bg-white"></div>
              </div>
              <div class="flex-1">
                <textarea
                  [value]="composerText()"
                  (input)="composerText.set(($any($event.target).value ?? '').toString())"
                  rows="3"
                  class="w-full resize-none rounded-xl border border-[#ccd0d5] bg-[#f0f2f5] px-3 py-2.5 text-[15px] text-[#1c1e21] outline-none focus:border-[#1877f2] focus:bg-white focus:ring-2 focus:ring-[#1877f2]/20"
                  placeholder="What's on your mind?"
                ></textarea>
                <div class="mt-3 flex items-center justify-between">
                  <span class="text-xs text-[#65676b]">
                    Visible to friends (and you)
                  </span>
                  <button
                    type="button"
                    (click)="submitPost()"
                    [disabled]="posting() || !composerText().trim()"
                    class="rounded-xl bg-[#1877f2] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {{ posting() ? 'Posting…' : 'Post' }}
                  </button>
                </div>
                @if (postError()) {
                  <div class="mt-2 text-sm text-red-700">{{ postError() }}</div>
                }
              </div>
            </div>
          </div>

          @if (loading()) {
            <div class="space-y-3">
              @for (_ of [0,1,2]; track _) {
                <div class="rounded-2xl border border-black/6 bg-white p-4">
                  <div class="h-4 w-32 rounded bg-[#f0f2f5]"></div>
                  <div class="mt-3 h-3 w-full rounded bg-[#f0f2f5]"></div>
                  <div class="mt-2 h-3 w-5/6 rounded bg-[#f0f2f5]"></div>
                </div>
              }
            </div>
          } @else {
            @if (feedPosts().length === 0) {
              <div class="rounded-2xl border border-black/6 bg-white p-8 text-center text-sm text-[#65676b]">
                No posts yet. Create the first post and it will appear here.
              </div>
            }

            @for (p of feedPosts(); track p.id) {
              <article class="rounded-2xl border border-black/6 bg-white p-4 shadow-[0_1px_10px_rgba(0,0,0,0.04)]">
                <div class="flex items-center gap-3">
                  <div
                    class="size-10 rounded-full bg-linear-to-tr from-[#f09433] via-[#dd2a7b] to-[#515bd4] p-[2px]"
                  >
                    <div class="size-full rounded-full bg-white"></div>
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <a
                        class="truncate text-sm font-semibold text-[#1c1e21] hover:underline"
                        [routerLink]="['/profile', p.user_id]"
                      >
                        {{ p.author?.name || ('User #' + p.user_id) }}
                      </a>
                      <span class="text-xs text-[#65676b]">·</span>
                      <time class="text-xs text-[#65676b]">
                        {{ formatDate(p.created_at) }}
                      </time>
                    </div>
                    <div class="text-xs text-[#8a8d91]">
                      {{ p.user_id === myId() ? 'You' : 'Friend' }}
                    </div>
                  </div>
                </div>

                <p class="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-[#1c1e21]">
                  {{ p.content }}
                </p>

                <div class="mt-4 flex items-center justify-between border-t border-black/5 pt-3 text-sm text-[#65676b]">
                  <button type="button" class="rounded-lg px-3 py-1.5 hover:bg-[#f0f2f5]">
                    Like
                  </button>
                  <button type="button" class="rounded-lg px-3 py-1.5 hover:bg-[#f0f2f5]">
                    Comment
                  </button>
                  <button type="button" class="rounded-lg px-3 py-1.5 hover:bg-[#f0f2f5]">
                    Share
                  </button>
                </div>
              </article>
            }
          }
        </section>

        <aside class="hidden space-y-4 lg:block">
          <div class="rounded-2xl border border-black/6 bg-white p-4">
            <div class="text-sm font-semibold text-[#1c1e21]">Friends</div>
            <div class="mt-3 space-y-2">
              @if (friends().length === 0) {
                <div class="text-sm text-[#65676b]">No friends yet.</div>
              }
              @for (f of friends(); track f.id) {
                <a
                  class="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-[#f0f2f5]"
                  [routerLink]="['/profile', f.id]"
                >
                  <span class="truncate text-sm text-[#1c1e21]">
                    {{ f.name || ('User #' + f.id) }}
                  </span>
                  <span class="text-xs text-[#8a8d91]">View</span>
                </a>
              }
            </div>
          </div>
        </aside>
      </main>
    </div>
  `,
})
export class FeedPageComponent {
  private readonly auth = inject(AuthService);
  private readonly postsApi = inject(PostsApi);
  private readonly friendsApi = inject(FriendshipsApi);
  private readonly usersApi = inject(UsersApi);

  protected readonly loading = signal(true);
  protected readonly posting = signal(false);
  protected readonly postError = signal<string | null>(null);

  protected readonly friends = signal<Array<{ id: number; name: string | null }>>([]);
  protected readonly feedPosts = signal<ViewPost[]>([]);
  protected readonly composerText = signal('');

  protected readonly myId = computed(() => this.auth.user()?.id ?? 0);

  constructor() {
    this.refreshFeed();
  }

  protected refreshFeed(): void {
    this.loading.set(true);
    this.friendsApi
      .getFriends()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (friends) => {
          this.friends.set(friends);
          const ids = friends.map((f) => f.id);
          this.loadFeed(ids);
        },
        error: () => {
          // still try loading my posts
          this.loadFeed([]);
        },
      });
  }

  private loadFeed(friendIds: number[]): void {
    this.postsApi.getFeed(friendIds).subscribe({
      next: (posts) => {
        const view: ViewPost[] = posts.map((p) => ({ ...p, author: null }));
        this.feedPosts.set(view);
        void this.hydrateAuthors(view);
      },
      error: () => {
        this.feedPosts.set([]);
      },
    });
  }

  private async hydrateAuthors(posts: ViewPost[]): Promise<void> {
    const ids = Array.from(new Set(posts.map((p) => p.user_id))).filter((n) => n > 0);
    const cache = new Map<number, UserDto>();

    await Promise.all(
      ids.map(async (id) => {
        const friendName = this.friends()
          .find((f) => f.id === id)?.name;
        if (friendName) {
          cache.set(id, { id, name: friendName, email: '' });
          return;
        }
        try {
          const user = await firstValueFrom(this.usersApi.getUserById(id));
          if (user) cache.set(id, user);
        } catch {
          // ignore
        }
      }),
    );

    const updated = this.feedPosts().map((p) => ({ ...p, author: cache.get(p.user_id) ?? null }));
    this.feedPosts.set(updated);
  }

  protected submitPost(): void {
    const content = this.composerText().trim();
    if (!content) return;
    this.postError.set(null);
    this.posting.set(true);

    // optimistic insert
    const optimisticId = Number(`9${Date.now()}`);
    const optimistic: ViewPost = {
      id: optimisticId,
      user_id: this.myId(),
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: null,
    };
    this.feedPosts.set([optimistic, ...this.feedPosts()]);
    this.composerText.set('');

    this.postsApi
      .createPost(content)
      .pipe(finalize(() => this.posting.set(false)))
      .subscribe({
        next: () => this.refreshFeed(),
        error: () => {
          this.postError.set('Failed to create post. Please try again.');
          this.feedPosts.set(this.feedPosts().filter((p) => p.id !== optimisticId));
        },
      });
  }

  protected logout(): void {
    this.auth.logout();
  }

  protected formatDate(value: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric' });
  }
}

