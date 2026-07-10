import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.css'
})
export class PatientDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  appointments: any[] = [];
  loading = true;

  ngOnInit() {
    this.fetchAppointments();
  }

  fetchAppointments() {
    const token = localStorage.getItem('token');
    this.http.get<any[]>('http://localhost:8081/api/v1/appointments/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        this.appointments = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
