import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { FriendDto, FriendshipStatus } from './api.models';

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

  blockUser(userId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.url(`/blocks/${userId}`), {});
  }

  unblockUser(userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(this.url(`/blocks/${userId}`));
  }
}

