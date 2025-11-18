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
  authLoading = false;
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

  toggleMode(event: Event) {
    event.preventDefault();
    this.isRegisterMode = !this.isRegisterMode;
    this.authError = null;
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.authError = null;
    const { email, password } = this.loginForm.value;

    try {
      this.authLoading = true;
      let user;

      if (this.isRegisterMode) {
        const result = await this.auth.signUp(email, password);
        user = result.user;
      } else {
        const result = await this.auth.signIn(email, password);
        user = result.user;
      }

      // seta userId no ApiService
      this.api.setUserId(user.id);

      // navega para dashboard
      await this.router.navigate(['/dashboard']);
    } catch (err: any) {
      console.error(err);
      this.authError =
        err?.message ||
        (this.isRegisterMode ? 'Erro ao criar conta' : 'Erro ao fazer login');
    } finally {
      this.authLoading = false;
    }
  }
}
