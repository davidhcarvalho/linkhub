import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-auth-page',
  templateUrl: './auth-page.component.html',
  styleUrls: ['./auth-page.component.scss']
})
export class AuthPageComponent {
  loginForm: FormGroup;
  isRegisterMode = false;
  loading = false;
  authError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private api: ApiService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Agora sem parâmetro, compatível com (click)="toggleMode()"
  toggleMode(): void {
    this.isRegisterMode = !this.isRegisterMode;
    this.authError = null;
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.authError = null;

    const { email, password } = this.loginForm.value;

    try {
      let user: any;

      if (this.isRegisterMode) {
        const result = await this.auth.signUp(email, password);
        user = (result as any).user || result;
      } else {
        const result = await this.auth.signIn(email, password);
        user = (result as any).user || result;
      }

      if (user && user.id) {
        this.api.setUserId(user.id);
      }

      await this.router.navigate(['/dashboard']);
    } catch (err: any) {
      console.error(err);
      this.authError =
        err?.message ||
        (this.isRegisterMode
          ? 'Erro ao criar conta. Tente novamente.'
          : 'Erro ao fazer login. Verifique seus dados.');
    } finally {
      this.loading = false;
    }
  }
}
