import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { UserDto } from './api.models';

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);

  private url(path: string): string {
    return `${environment.apiBaseUrl}/users${path}`;
  }

  getUserById(id: number): Observable<UserDto> {
    return this.http.get<UserDto>(this.url(`/${id}`));
  }
}

