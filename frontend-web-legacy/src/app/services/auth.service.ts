import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AuthenticationRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role: 'PATIENT' | 'MEDECIN' | 'ADMINISTRATEUR' | 'RECEPTIONNISTE';
}

export interface AuthenticationResponse {
  token: string;
  nom: string;
  prenom: string;
  role: 'PATIENT' | 'MEDECIN' | 'ADMINISTRATEUR' | 'RECEPTIONNISTE';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/v1/auth';

  register(request: RegisterRequest): Observable<AuthenticationResponse> {
    return this.http.post<AuthenticationResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(response => this.setUser(response))
    );
  }

  login(request: AuthenticationRequest): Observable<AuthenticationResponse> {
    return this.http.post<AuthenticationResponse>(`${this.apiUrl}/authenticate`, request).pipe(
      tap(response => this.setUser(response))
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  private setUser(response: AuthenticationResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify({
      nom: response.nom,
      prenom: response.prenom,
      role: response.role
    }));
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
