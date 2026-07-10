import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { ChatService, ChatMessage } from '../../../services/chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private chatService = inject(ChatService);

  user: any;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  selectedContactEmail: string = ''; // Pour la démo, on simule un contact
  pollInterval: any;

  ngOnInit() {
    this.user = this.authService.getUser();
    // Simulation: si c'est un patient, il parle à un médecin test
    if (this.user.role === 'PATIENT') {
        this.selectedContactEmail = 'doctor@test.com';
    } else {
        this.selectedContactEmail = 'patient@test.com';
    }
    
    this.loadHistory();
    // Polling toutes les 5 secondes pour la démo
    this.pollInterval = setInterval(() => this.loadHistory(), 5000);
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  loadHistory() {
    if (!this.selectedContactEmail) return;
    this.chatService.getHistory(this.user.email, this.selectedContactEmail).subscribe(data => {
      this.messages = data;
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedContactEmail) return;

    const msg: ChatMessage = {
      contenu: this.newMessage,
      expediteurEmail: this.user.email,
      destinataireEmail: this.selectedContactEmail
    };

    const token = localStorage.getItem('token');
    // On utilise un simple POST REST pour simplifier l'intégration STOMP
    this.http.post('http://localhost:8081/api/v1/chat/send-rest', msg, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe(() => {
      this.newMessage = '';
      this.loadHistory();
    });
  }
}
