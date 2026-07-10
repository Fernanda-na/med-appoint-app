import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.css'
})
export class ProfileSettingsComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  user: any;
  selectedFile: File | null = null;
  uploading = false;
  
  documents: any[] = [];
  loadingDocs = true;

  ngOnInit() {
    this.user = this.authService.getUser();
    if (this.user.role === 'PATIENT') {
      this.fetchDocuments();
    }
  }

  fetchDocuments() {
    const token = localStorage.getItem('token');
    this.http.get<any[]>('http://localhost:8081/api/v1/profile/documents', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        this.documents = data;
        this.loadingDocs = false;
      },
      error: () => this.loadingDocs = false
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
        this.uploadAvatar();
    }
  }

  uploadAvatar() {
    if (!this.selectedFile) return;

    this.uploading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    const token = localStorage.getItem('token');
    this.http.post<any>('http://localhost:8081/api/v1/profile/avatar', formData, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        this.user.avatarUrl = res.avatarUrl;
        // Mettre à jour le localStorage
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        storedUser.avatarUrl = res.avatarUrl;
        localStorage.setItem('user', JSON.stringify(storedUser));
        this.uploading = false;
        this.selectedFile = null;
      },
      error: () => {
        this.uploading = false;
        alert("Erreur lors de l'upload de l'avatar");
      }
    });
  }
}
