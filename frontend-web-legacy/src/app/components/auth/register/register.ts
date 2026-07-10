import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegisterRequest } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  authService = inject(AuthService);
  router = inject(Router);

  user: RegisterRequest = {
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'PATIENT'
  };

  error: string | null = null;
  loading = false;

  roles = [
    { value: 'PATIENT', label: 'Patient' },
    { value: 'MEDECIN', label: 'Médecin' },
    { value: 'RECEPTIONNISTE', label: 'Réceptionniste' }
  ];

  onSubmit() {
    this.loading = true;
    this.error = null;
    this.authService.register(this.user).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error = "Une erreur est survenue lors de l'inscription.";
        this.loading = false;
      }
    });
  }
}
