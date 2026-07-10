import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Doctor {
  id: number;
  nom: string;
  prenom: string;
  lieuConsultation: string;
  specialite?: {
    id: number;
    nom: string;
  };
}

export interface Specialty {
  id: number;
  nom: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/v1';

  getDoctors(specialty?: string): Observable<Doctor[]> {
    const url = specialty ? `${this.apiUrl}/doctors?specialty=${specialty}` : `${this.apiUrl}/doctors`;
    return this.http.get<Doctor[]>(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
  }

  getSpecialties(): Observable<Specialty[]> {
    return this.http.get<Specialty[]>(`${this.apiUrl}/doctors/specialties`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
  }

  bookAppointment(medecinId: number, date: Date, motif: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/appointments/book`, {
      medecinId,
      dateHeureDebut: date.toISOString(),
      motif
    }, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
  }
}
