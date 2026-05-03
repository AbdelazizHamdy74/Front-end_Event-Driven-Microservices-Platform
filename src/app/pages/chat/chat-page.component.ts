import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ChatsApi } from '../../core/api/chats.api';
import type { ChatMessageDto } from '../../core/api/api.models';
import { ChatRealtimeService } from '../../core/realtime/chat-realtime.service';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-svh bg-[#fafafa]">
      <header class="sticky top-0 z-10 border-b border-black/8 bg-white">
        <div class="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <a
            routerLink="/home"
            class="text-sm font-semibold text-[#1877f2] hover:underline"
          >
            ← Feed
          </a>
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-semibold text-[#1c1e21]">
              {{ headerTitle() }}
            </div>
            <a
              class="text-xs text-[#65676b] hover:underline"
              [routerLink]="['/profile', peerId()]"
            >
              View profile
            </a>
          </div>
        </div>
      </header>

      <main class="mx-auto flex max-w-3xl flex-col px-4 py-4" style="min-height: calc(100svh - 57px)">
        @if (!peerId()) {
          <div class="text-sm text-[#65676b]">Invalid conversation.</div>
        } @else {
          @if (loadError()) {
            <div class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {{ loadError() }}
            </div>
          }

          <div class="flex-1 space-y-2 overflow-y-auto py-3">
            @if (loading()) {
              <div class="text-sm text-[#65676b]">Loading messages…</div>
            }
            @for (m of messages(); track m.id) {
              <div
                class="flex"
                [class.justify-end]="isMine(m)"
                [class.justify-start]="!isMine(m)"
              >
                <div
                  class="max-w-[85%] rounded-2xl px-3 py-2 text-[15px] leading-snug"
                  [class.bg-[#1877f2]]="isMine(m)"
                  [class.text-white]="isMine(m)"
                  [class.bg-[#e4e6eb]]="!isMine(m)"
                  [class.text-[#1c1e21]]="!isMine(m)"
                >
                  <div class="whitespace-pre-wrap">{{ m.content }}</div>
                  <div
                    class="mt-1 text-[11px] opacity-80"
                    [class.text-right]="isMine(m)"
                  >
                    {{ formatTime(m.createdAt) }}
                  </div>
                </div>
              </div>
            }
          </div>

          <div class="border-t border-black/8 bg-[#fafafa] pt-3">
            @if (sendError()) {
              <div class="mb-2 text-sm text-red-700">{{ sendError() }}</div>
            }
            <div class="flex items-end gap-2">
              <textarea
                rows="2"
                class="min-h-11 flex-1 resize-none rounded-2xl border border-[#ccd0d5] bg-white px-3 py-2 text-[15px] outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/20"
                [value]="draft()"
                (input)="draft.set(($any($event.target).value ?? '').toString())"
                (keydown.enter)="$event.preventDefault(); send()"
                placeholder="Write a message…"
              ></textarea>
              <button
                type="button"
                (click)="send()"
                [disabled]="sending() || !draft().trim()"
                class="shrink-0 rounded-2xl bg-[#1877f2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:opacity-50"
              >
                {{ sending() ? '…' : 'Send' }}
              </button>
            </div>
          </div>
        }
      </main>
    </div>
  `,
})
export class ChatPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly chatsApi = inject(ChatsApi);
  private readonly chatRt = inject(ChatRealtimeService);

  protected readonly peerId = signal(0);
  protected readonly messages = signal<ChatMessageDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly sending = signal(false);
  protected readonly draft = signal('');
  protected readonly loadError = signal<string | null>(null);
  protected readonly sendError = signal<string | null>(null);

  protected readonly headerTitle = () => {
    const id = this.peerId();
    if (!id) return 'Messages';
    return `Chat · User #${id}`;
  };

  private readonly chatLive = effect((onCleanup) => {
    const peer = this.peerId();
    const me = this.auth.user()?.id;
    if (!peer || me == null || Number(me) <= 0) return;

    this.chatRt.ensureConnected();
    const my = Number(me);
    const p = Number(peer);

    const unsub = this.chatRt.onChatNew((msg) => {
      const fi = Number(msg.fromUserId);
      const ti = Number(msg.toUserId);
      const involves = (fi === p && ti === my) || (fi === my && ti === p);
      if (!involves) return;
      this.messages.update((list) => {
        if (list.some((m) => Number(m.id) === Number(msg.id))) return list;
        return [...list, msg];
      });
    });
    onCleanup(() => unsub());
  });

  constructor() {
    this.chatRt.ensureConnected();
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((pm) => {
      const id = Number(pm.get('id'));
      this.peerId.set(Number.isFinite(id) && id > 0 ? id : 0);
      this.messages.set([]);
      this.loadError.set(null);
      this.loadMessages();
    });
  }

  protected isMine(m: ChatMessageDto): boolean {
    const uid = Number(this.auth.user()?.id ?? 0);
    return Number(m.fromUserId) === uid;
  }

  private loadMessages(): void {
    const id = this.peerId();
    if (!id) return;
    this.loading.set(true);
    this.chatsApi.getMessages(id).subscribe({
      next: (rows) => {
        this.messages.set(rows);
        this.loading.set(false);
      },
      error: (err) => {
        this.loadError.set(err?.error?.message || 'Could not load messages.');
        this.loading.set(false);
      },
    });
  }

  protected send(): void {
    const id = this.peerId();
    const text = this.draft().trim();
    if (!id || !text || this.sending()) return;
    this.sendError.set(null);
    this.sending.set(true);
    this.chatsApi
      .sendMessage(id, text)
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: (msg) => {
          this.draft.set('');
          this.messages.update((list) => {
            if (list.some((m) => Number(m.id) === Number(msg.id))) return list;
            return [...list, msg];
          });
        },
        error: (err) => {
          this.sendError.set(err?.error?.message || 'Send failed.');
        },
      });
  }

  protected formatTime(value: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
}
