import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { FriendshipsApi } from '../../core/api/friendships.api';
import { PostsApi } from '../../core/api/posts.api';
import { LikesApi } from '../../core/api/likes.api';
import { CommentsApi } from '../../core/api/comments.api';
import { UsersApi } from '../../core/api/users.api';
import type { CommentDto, PostDto, UserDto } from '../../core/api/api.models';

type ReactionType = 'like' | 'love';

type ViewPost = PostDto & {
  author?: UserDto | null;
  likeCount?: number;
  likedByMe?: boolean;
  reaction?: ReactionType | null;
  comments?: CommentDto[];
  commentsCount?: number;
  commentsOpen?: boolean;
  commentDraft?: string;
  reacting?: boolean;
  commenting?: boolean;
};

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

                <div class="mt-3 flex items-center justify-between text-sm text-[#65676b]">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center gap-1">
                      <span
                        class="inline-flex size-5 items-center justify-center rounded-full bg-[#1877f2] text-[11px] text-white"
                        title="Like"
                      >
                        👍
                      </span>
                      <span
                        class="inline-flex size-5 items-center justify-center rounded-full bg-[#f02849] text-[11px] text-white"
                        title="Love"
                      >
                        ❤️
                      </span>
                    </span>
                    <span>{{ p.likeCount ?? 0 }}</span>
                  </div>
                  <button
                    type="button"
                    class="hover:underline"
                    (click)="toggleComments(p.id)"
                  >
                    {{ p.commentsCount ?? 0 }} comments
                  </button>
                </div>

                <div class="mt-4 flex items-center justify-between border-t border-black/5 pt-3 text-sm text-[#65676b]">
                  <div
                    class="relative"
                    (mouseenter)="openReactionPicker(p.id)"
                    (mouseleave)="closeReactionPicker(p.id)"
                  >
                    <button
                      type="button"
                      [disabled]="p.reacting"
                      (click)="onLikeButtonClick(p.id)"
                      (touchstart)="openReactionPicker(p.id)"
                      class="rounded-lg px-3 py-1.5 hover:bg-[#f0f2f5] disabled:opacity-60"
                    >
                      @if (p.likedByMe) {
                        @if (p.reaction === 'love') {
                          <span class="text-[#f02849] font-semibold">Love</span>
                        } @else {
                          <span class="text-[#1877f2] font-semibold">Like</span>
                        }
                      } @else {
                        <span>Like</span>
                      }
                    </button>

                    @if (reactionPickerForPostId() === p.id) {
                      <div
                        class="absolute -top-12 left-0 z-10 flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-1 shadow-lg"
                      >
                        <button
                          type="button"
                          class="rounded-full px-2 py-1 text-sm hover:bg-[#f0f2f5]"
                          (click)="react(p.id, 'like')"
                          title="Like"
                        >
                          👍
                        </button>
                        <button
                          type="button"
                          class="rounded-full px-2 py-1 text-sm hover:bg-[#f0f2f5]"
                          (click)="react(p.id, 'love')"
                          title="Love"
                        >
                          ❤️
                        </button>
                      </div>
                    }
                  </div>

                  <button
                    type="button"
                    (click)="toggleComments(p.id)"
                    class="rounded-lg px-3 py-1.5 hover:bg-[#f0f2f5]"
                  >
                    Comment
                  </button>
                  <button type="button" class="rounded-lg px-3 py-1.5 hover:bg-[#f0f2f5]">
                    Share
                  </button>
                </div>

                @if (p.commentsOpen) {
                  <div class="mt-3 border-t border-black/5 pt-3">
                    <div class="space-y-2">
                      @if ((p.comments?.length ?? 0) === 0) {
                        <div class="text-sm text-[#65676b]">No comments yet.</div>
                      }
                      @for (c of (p.comments ?? []); track c.id) {
                        <div class="flex items-start gap-2">
                          <div class="size-8 rounded-full bg-[#f0f2f5]"></div>
                          <div class="min-w-0 flex-1 rounded-2xl bg-[#f0f2f5] px-3 py-2">
                            <div class="text-xs font-semibold text-[#1c1e21]">
                              User #{{ c.user_id }}
                            </div>
                            <div class="whitespace-pre-wrap text-sm text-[#1c1e21]">
                              {{ c.content }}
                            </div>
                          </div>
                        </div>
                      }
                    </div>

                    <div class="mt-3 flex items-end gap-2">
                      <div class="size-8 rounded-full bg-[#f0f2f5]"></div>
                      <div class="flex-1">
                        <textarea
                          rows="1"
                          [value]="p.commentDraft ?? ''"
                          (input)="setCommentDraft(p.id, ($any($event.target).value ?? '').toString())"
                          class="w-full resize-none rounded-2xl border border-[#ccd0d5] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/20"
                          placeholder="Write a comment…"
                        ></textarea>
                      </div>
                      <button
                        type="button"
                        [disabled]="p.commenting || !(p.commentDraft ?? '').trim()"
                        (click)="submitComment(p.id)"
                        class="rounded-xl bg-[#1877f2] px-3 py-2 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:opacity-60"
                      >
                        {{ p.commenting ? 'Sending…' : 'Send' }}
                      </button>
                    </div>
                  </div>
                }
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
  private readonly likesApi = inject(LikesApi);
  private readonly commentsApi = inject(CommentsApi);
  private readonly usersApi = inject(UsersApi);

  protected readonly loading = signal(true);
  protected readonly posting = signal(false);
  protected readonly postError = signal<string | null>(null);

  protected readonly friends = signal<Array<{ id: number; name: string | null }>>([]);
  protected readonly feedPosts = signal<ViewPost[]>([]);
  protected readonly composerText = signal('');
  protected readonly reactionPickerForPostId = signal<number | null>(null);

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
        const view: ViewPost[] = posts.map((p) => ({
          ...p,
          author: null,
          likeCount: 0,
          likedByMe: false,
          reaction: null,
          comments: [],
          commentsCount: 0,
          commentsOpen: false,
          commentDraft: '',
          reacting: false,
          commenting: false,
        }));
        this.feedPosts.set(view);
        void this.hydrateAuthors(view);
        void this.hydrateLikes(view);
        void this.hydrateCommentsCount(view);
      },
      error: () => {
        this.feedPosts.set([]);
      },
    });
  }

  private async hydrateLikes(posts: ViewPost[]): Promise<void> {
    await Promise.all(
      posts.map(async (p) => {
        try {
          const res = await firstValueFrom(this.likesApi.getLikeCount(p.id));
          this.patchPost(p.id, { likeCount: res.count });
        } catch {
          // ignore
        }

        try {
          const status = await firstValueFrom(this.likesApi.getMyLikeStatus(p.id));
          this.patchPost(p.id, { likedByMe: status.liked });
        } catch {
          // ignore
        }
      }),
    );
  }

  private async hydrateCommentsCount(posts: ViewPost[]): Promise<void> {
    // We don't have a /count endpoint in Comment-Service, so we fetch the list and use length.
    // This keeps the "X comments" correct even before opening the comments panel.
    await Promise.all(
      posts.map(async (p) => {
        try {
          const comments = await firstValueFrom(this.commentsApi.getCommentsByPost(p.id));
          this.patchPost(p.id, { commentsCount: comments.length });
        } catch {
          // ignore
        }
      }),
    );
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

  protected openReactionPicker(postId: number): void {
    this.reactionPickerForPostId.set(postId);
  }

  protected closeReactionPicker(postId: number): void {
    if (this.reactionPickerForPostId() === postId) {
      this.reactionPickerForPostId.set(null);
    }
  }

  protected toggleLike(postId: number): void {
    const p = this.findPost(postId);
    if (!p || p.reacting) return;
    if (p.likedByMe) {
      this.react(postId, null);
    } else {
      this.react(postId, 'like');
    }
  }

  protected onLikeButtonClick(postId: number): void {
    const p = this.findPost(postId);
    if (!p || p.reacting) return;

    // Facebook-like behavior:
    // - If already reacted → click removes reaction
    // - If not reacted → click opens picker (works on mobile), letting the user choose 👍/❤️
    if (p.likedByMe) {
      this.react(postId, null);
      return;
    }

    if (this.reactionPickerForPostId() === postId) {
      // second click defaults to Like
      this.react(postId, 'like');
      return;
    }

    this.openReactionPicker(postId);
  }

  protected react(postId: number, reaction: ReactionType | null): void {
    const p = this.findPost(postId);
    if (!p || p.reacting) return;

    this.patchPost(postId, { reacting: true });
    this.reactionPickerForPostId.set(null);

    const done = () => this.patchPost(postId, { reacting: false });

    if (reaction === null) {
      // unlike
      this.likesApi.unlikePost(postId).subscribe({
        next: () => {
          const current = this.findPost(postId);
          const nextCount = Math.max(0, (current?.likeCount ?? 0) - 1);
          this.patchPost(postId, { likedByMe: false, reaction: null, likeCount: nextCount });
          done();
        },
        error: () => done(),
      });
      return;
    }

    // like (we treat love as like for backend; UI shows reaction)
    this.likesApi.likePost(postId).subscribe({
      next: () => {
        const current = this.findPost(postId);
        const nextCount = (current?.likeCount ?? 0) + (current?.likedByMe ? 0 : 1);
        this.patchPost(postId, { likedByMe: true, reaction, likeCount: nextCount });
        done();
      },
      error: () => done(),
    });
  }

  protected toggleComments(postId: number): void {
    const p = this.findPost(postId);
    if (!p) return;
    const nextOpen = !p.commentsOpen;
    this.patchPost(postId, { commentsOpen: nextOpen });
    if (nextOpen) {
      this.loadComments(postId);
    }
  }

  protected setCommentDraft(postId: number, value: string): void {
    this.patchPost(postId, { commentDraft: value });
  }

  protected loadComments(postId: number): void {
    this.commentsApi.getCommentsByPost(postId).subscribe({
      next: (comments) => this.patchPost(postId, { comments, commentsCount: comments.length }),
      error: () => this.patchPost(postId, { comments: [] }),
    });
  }

  protected submitComment(postId: number): void {
    const p = this.findPost(postId);
    const content = (p?.commentDraft ?? '').trim();
    if (!p || !content || p.commenting) return;

    this.patchPost(postId, { commenting: true });
    this.commentsApi.createComment(postId, content).subscribe({
      next: () => {
        this.patchPost(postId, { commentDraft: '' });
        this.loadComments(postId);
        this.patchPost(postId, { commenting: false });
      },
      error: () => this.patchPost(postId, { commenting: false }),
    });
  }

  private findPost(postId: number): ViewPost | undefined {
    return this.feedPosts().find((p) => p.id === postId);
  }

  private patchPost(postId: number, patch: Partial<ViewPost>): void {
    this.feedPosts.set(
      this.feedPosts().map((p) => (p.id === postId ? { ...p, ...patch } : p)),
    );
  }

  protected formatDate(value: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric' });
  }
}

