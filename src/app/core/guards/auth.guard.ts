import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean | UrlTree> {
    // tenta recuperar usuário logado via Supabase
    const user = await this.authService.getCurrentUser();

    if (user) {
      // importantíssimo: setar userId no ApiService
      this.apiService.setUserId(user.id);
      return true;
    }

    // se não tiver usuário, manda pro login
    return this.router.parseUrl('/login');
  }
}