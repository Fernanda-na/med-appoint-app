import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorService, Doctor, Specialty } from '../../../../services/doctor.service';

@Component({
  selector: 'app-doctor-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-search.component.html',
  styleUrl: './doctor-search.component.css'
})
export class DoctorSearchComponent implements OnInit {
  doctorService = inject(DoctorService);
  
  doctors: Doctor[] = [];
  specialties: Specialty[] = [];
  selectedSpecialty: string = '';
  loading = false;
  
  bookingDoctor: Doctor | null = null;
  bookingDate: string = '';
  bookingMotif: string = '';
  bookingLoading = false;
  bookingSuccess = false;

  ngOnInit() {
    this.fetchSpecialties();
    this.search();
  }

  fetchSpecialties() {
    this.doctorService.getSpecialties().subscribe(data => this.specialties = data);
  }

  search() {
    this.loading = true;
    this.doctorService.getDoctors(this.selectedSpecialty).subscribe({
      next: (data) => {
        this.doctors = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  openBooking(doctor: Doctor) {
    this.bookingDoctor = doctor;
    this.bookingSuccess = false;
  }

  confirmBooking() {
    if (!this.bookingDoctor || !this.bookingDate) return;
    
    this.bookingLoading = true;
    this.doctorService.bookAppointment(
      this.bookingDoctor.id, 
      new Date(this.bookingDate), 
      this.bookingMotif
    ).subscribe({
      next: () => {
        this.bookingLoading = false;
        this.bookingSuccess = true;
        setTimeout(() => this.bookingDoctor = null, 2000);
      },
      error: (err) => {
        this.bookingLoading = false;
        alert(err.error?.message || "Erreur lors de la réservation");
      }
    });
  }
}
