import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { CommentDto } from './api.models';

@Injectable({ providedIn: 'root' })
export class CommentsApi {
  private readonly http = inject(HttpClient);

  private url(path: string): string {
    return `${environment.apiBaseUrl}/comments${path}`;
  }

  createComment(postId: number, content: string): Observable<unknown> {
    return this.http.post(this.url(`/posts/${postId}`), { content });
  }

  getCommentsByPost(postId: number): Observable<CommentDto[]> {
    return this.http.get<CommentDto[]>(this.url(`/posts/${postId}`));
  }
}

