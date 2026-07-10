import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PatientDashboardComponent } from './patient/patient-dashboard.component';
import { MedecinDashboardComponent } from './medecin/medecin-dashboard.component';
import { DoctorSearchComponent } from './patient/doctor-search/doctor-search.component';
import { ProfileSettingsComponent } from './profile/profile-settings.component';
import { NotificationCenterComponent } from './notifications/notification-center.component';
import { ChatComponent } from './chat/chat.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, PatientDashboardComponent, MedecinDashboardComponent, DoctorSearchComponent, ProfileSettingsComponent, NotificationCenterComponent, ChatComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  
  user: any;
  activeTab = 'dashboard';

  ngOnInit() {
    this.user = this.authService.getUser();
    if (!this.user) {
      this.router.navigate(['/login']);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
