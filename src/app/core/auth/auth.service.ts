import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, UrlTree } from '@angular/router';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { AuthUser, LoginResponse, SessionResponse, SignupResponse } from './auth.models';
import { TokenStorage } from './token-storage';
import { ChatRealtimeService } from '../realtime/chat-realtime.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenStorage = inject(TokenStorage);
  private readonly chatRealtime = inject(ChatRealtimeService);

  private readonly userSignal = signal<AuthUser | null>(null);

  readonly user = this.userSignal.asReadonly();

  getToken(): string | null {
    return this.tokenStorage.getToken();
  }

  private authUrl(path: string): string {
    return `${environment.apiBaseUrl}/auth${path}`;
  }

  ensureSession(): Observable<boolean | UrlTree> {
    const token = this.tokenStorage.getToken();
    if (!token) {
      return of(this.router.createUrlTree(['/login']));
    }
    if (this.userSignal()) {
      return of(true);
    }
    return this.http.get<SessionResponse>(this.authUrl('/session')).pipe(
      tap((res) => this.userSignal.set(res.user)),
      map(() => true),
      catchError(() => {
        this.clearLocalAuth();
        return of(this.router.createUrlTree(['/login']));
      }),
    );
  }

  login(email: string, password: string): Observable<void> {
    return this.http.post<LoginResponse>(this.authUrl('/login'), { email, password }).pipe(
      tap((res) => {
        this.chatRealtime.disconnect();
        this.tokenStorage.setToken(res.token);
      }),
      switchMap(() => this.http.get<SessionResponse>(this.authUrl('/session'))),
      tap((res) => this.userSignal.set(res.user)),
      map(() => undefined),
      catchError((err) => {
        this.clearLocalAuth();
        return throwError(() => err);
      }),
    );
  }

  signup(name: string, email: string, password: string): Observable<void> {
    return this.http
      .post<SignupResponse>(this.authUrl('/signup'), { name, email, password })
      .pipe(switchMap(() => this.login(email, password)));
  }

  logout(): void {
    this.clearLocalAuth();
    void this.router.navigateByUrl('/login');
  }

  private clearLocalAuth(): void {
    this.chatRealtime.disconnect();
    this.tokenStorage.clearToken();
    this.userSignal.set(null);
  }
}
