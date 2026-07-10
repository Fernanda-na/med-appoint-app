import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, AuthenticationRequest } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);

  credentials: AuthenticationRequest = {
    email: '',
    password: ''
  };

  error: string | null = null;
  loading = false;

  onSubmit() {
    this.loading = true;
    this.error = null;
    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error = 'Email ou mot de passe incorrect.';
        this.loading = false;
      }
    });
  }
}
