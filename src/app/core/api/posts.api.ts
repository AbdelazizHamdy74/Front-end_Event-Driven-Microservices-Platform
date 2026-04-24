import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { PostDto } from './api.models';

@Injectable({ providedIn: 'root' })
export class PostsApi {
  private readonly http = inject(HttpClient);

  private url(path: string): string {
    return `${environment.apiBaseUrl}/posts${path}`;
  }

  createPost(content: string): Observable<{ id: number; userId: number; content: string }> {
    return this.http.post<{ id: number; userId: number; content: string }>(this.url(''), {
      content,
    });
  }

  getMyPosts(): Observable<PostDto[]> {
    return this.http.get<PostDto[]>(this.url(''));
  }

  getUserPosts(userId: number): Observable<PostDto[]> {
    return this.http.get<PostDto[]>(this.url(`/user/${userId}`));
  }

  getFeed(userIds: number[]): Observable<PostDto[]> {
    const ids = Array.from(new Set(userIds)).filter((n) => Number.isFinite(n) && n > 0);
    const params = new HttpParams().set('userIds', ids.join(','));
    return this.http.get<PostDto[]>(this.url('/feed'), { params });
  }
}

