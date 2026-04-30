import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { FriendDto, FriendshipStatus } from './api.models';

export interface FriendRequestDto {
  userId: number;
  name: string | null;
  direction: 'received' | 'sent';
}

@Injectable({ providedIn: 'root' })
export class FriendshipsApi {
  private readonly http = inject(HttpClient);

  private url(path: string): string {
    return `${environment.apiBaseUrl}/friendships${path}`;
  }

  getFriends(): Observable<FriendDto[]> {
    return this.http.get<FriendDto[]>(this.url('/friends'));
  }

  getStatus(userId: number): Observable<{ status: FriendshipStatus }> {
    return this.http.get<{ status: FriendshipStatus }>(this.url(`/status/${userId}`));
  }

  getRequests(direction: 'received' | 'sent' = 'received'): Observable<FriendRequestDto[]> {
    return this.http.get<FriendRequestDto[]>(this.url('/requests'), {
      params: { direction },
    });
  }

  sendRequest(userId: number, userName?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.url(`/requests/${userId}`), {
      userName,
    });
  }

  acceptRequest(userId: number, userName?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.url(`/requests/${userId}/accept`), {
      userName,
    });
  }

  rejectRequest(userId: number, userName?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.url(`/requests/${userId}/reject`), {
      userName,
    });
  }

  cancelRequest(userId: number, userName?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.url(`/requests/${userId}/cancel`), {
      userName,
    });
  }

  blockUser(userId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.url(`/blocks/${userId}`), {});
  }

  unblockUser(userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(this.url(`/blocks/${userId}`));
  }
}

