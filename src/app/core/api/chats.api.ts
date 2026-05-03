import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ChatMessageDto, ConversationSummaryDto, MessageRequestDto } from './api.models';

@Injectable({ providedIn: 'root' })
export class ChatsApi {
  private readonly http = inject(HttpClient);

  private url(path: string): string {
    return `${environment.apiBaseUrl}/chats${path}`;
  }

  getConversations(): Observable<ConversationSummaryDto[]> {
    return this.http.get<ConversationSummaryDto[]>(this.url('/'));
  }

  getMessages(otherUserId: number): Observable<ChatMessageDto[]> {
    return this.http.get<ChatMessageDto[]>(this.url(`/${otherUserId}/messages`));
  }

  sendMessage(otherUserId: number, content: string): Observable<ChatMessageDto> {
    return this.http.post<ChatMessageDto>(this.url(`/${otherUserId}/messages`), { content });
  }

  listIncomingMessageRequests(): Observable<MessageRequestDto[]> {
    return this.http.get<MessageRequestDto[]>(this.url('/message-requests/incoming'));
  }

  sendMessageRequest(toUserId: number, content: string): Observable<MessageRequestDto> {
    return this.http.post<MessageRequestDto>(this.url(`/message-requests/${toUserId}`), {
      content,
    });
  }

  acceptMessageRequest(fromUserId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      this.url(`/message-requests/${fromUserId}/accept`),
      {},
    );
  }

  declineMessageRequest(fromUserId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      this.url(`/message-requests/${fromUserId}/decline`),
      {},
    );
  }
}
