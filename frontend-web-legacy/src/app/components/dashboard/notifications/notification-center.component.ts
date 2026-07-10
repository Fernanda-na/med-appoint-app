import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

export interface Notification {
  id: number;
  titre: string;
  message: string;
  dateCreation: string;
  lu: boolean;
}

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.css'
})
export class NotificationCenterComponent implements OnInit {
  private http = inject(HttpClient);
  notifications: Notification[] = [];
  loading = true;

  ngOnInit() {
    this.fetchNotifications();
  }

  fetchNotifications() {
    const token = localStorage.getItem('token');
    this.http.get<Notification[]>('http://localhost:8081/api/v1/profile/notifications', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        this.notifications = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  markAsRead(id: number) {
    const token = localStorage.getItem('token');
    this.http.patch(`http://localhost:8081/api/v1/profile/notifications/${id}/read`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe(() => {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) notif.lu = true;
    });
  }
}
