import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  id?: number;
  contenu: string;
  expediteurEmail: string;
  destinataireEmail: string;
  dateEnvoi?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/v1/chat';

  getHistory(currentUser: string, withUser: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/history?currentUser=${currentUser}&withUser=${withUser}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
  }
}
