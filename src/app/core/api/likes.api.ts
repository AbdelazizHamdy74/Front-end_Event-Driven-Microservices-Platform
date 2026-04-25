import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { LikeCountDto } from './api.models';

@Injectable({ providedIn: 'root' })
export class LikesApi {
  private readonly http = inject(HttpClient);

  private url(path: string): string {
    return `${environment.apiBaseUrl}/likes${path}`;
  }

  likePost(postId: number): Observable<unknown> {
    return this.http.post(this.url(`/posts/${postId}`), {});
  }

  unlikePost(postId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(this.url(`/posts/${postId}`));
  }

  getLikeCount(postId: number): Observable<LikeCountDto> {
    return this.http.get<LikeCountDto>(this.url(`/posts/${postId}/count`));
  }

  getMyLikeStatus(postId: number): Observable<{ postId: number; liked: boolean }> {
    return this.http.get<{ postId: number; liked: boolean }>(this.url(`/posts/${postId}/me`));
  }
}

