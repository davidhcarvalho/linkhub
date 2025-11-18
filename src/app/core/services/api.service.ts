import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Link {
  id?: string;
  user_id?: string;
  title: string;
  url: string;
  short_url?: string;
  tags?: string[];
  collection_id?: string | null;
  clicks?: number;
  views?: number;
  shares?: number;
  is_favorite?: boolean;
  created_at?: string;
}

export interface Collection {
  id?: string;
  user_id?: string;
  name: string;
  description?: string;
  visibility: 'publico' | 'restrito' | 'privado';
  created_at?: string;
}

export interface OverviewMetrics {
  linksTotal: number;
  collectionsTotal: number;
  totalViews: number;
  totalShares: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'http://localhost:3000/api';
  private userId: string | null = null;

  constructor(private http: HttpClient) {}

  setUserId(userId: string) {
    this.userId = userId;
  }

  private ensureUserId(): string {
    if (!this.userId) {
      throw new Error('userId não definido. Faça login primeiro.');
    }
    return this.userId;
  }

  // Links
  getLinks(): Observable<Link[]> {
    const userId = this.ensureUserId();
    return this.http.get<Link[]>(`${this.baseUrl}/links`, {
      params: { userId }
    });
  }

  createLink(payload: Partial<Link>): Observable<Link> {
    const userId = this.ensureUserId();
    return this.http.post<Link>(`${this.baseUrl}/links`, {
      userId,
      title: payload.title,
      url: payload.url,
      shortUrl: payload.short_url,
      tags: payload.tags,
      collectionId: payload.collection_id
    });
  }

  updateLink(id: string, payload: Partial<Link>): Observable<Link> {
    return this.http.put<Link>(`${this.baseUrl}/links/${id}`, payload);
  }

  deleteLink(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/links/${id}`);
  }

  // Collections
  getCollections(): Observable<Collection[]> {
    const userId = this.ensureUserId();
    return this.http.get<Collection[]>(`${this.baseUrl}/collections`, {
      params: { userId }
    });
  }

  createCollection(payload: Partial<Collection>): Observable<Collection> {
    const userId = this.ensureUserId();
    return this.http.post<Collection>(`${this.baseUrl}/collections`, {
      userId,
      name: payload.name,
      description: payload.description,
      visibility: payload.visibility || 'publico'
    });
  }

  updateCollection(id: string, payload: Partial<Collection>): Observable<Collection> {
    return this.http.put<Collection>(`${this.baseUrl}/collections/${id}`, payload);
  }

  deleteCollection(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/collections/${id}`);
  }

  // Metrics
  getOverviewMetrics(): Observable<OverviewMetrics> {
    const userId = this.ensureUserId();
    return this.http.get<OverviewMetrics>(`${this.baseUrl}/metrics/overview`, {
      params: { userId }
    });
  }
}
