import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
  // se quiser exibir email do usuário depois, dá pra buscar e guardar aqui
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async logout() {
    await this.auth.signOut();
    await this.router.navigate(['/login']);
  }
}
