import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';

// TODO: substitua pelos valores do seu projeto Supabase
const SUPABASE_URL = 'https://vkghzbltbkkcfqwrhbcw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZ2h6Ymx0YmtrY2Zxd3JoYmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzAxNDksImV4cCI6MjA3ODY0NjE0OX0.bI0qXUGL5AzywWGLKE35LvuvdmXsj4Qp0Kvyy5cFtjY';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  /** Login com email/senha */
  async signIn(email: string, password: string): Promise<{ user: User; session: Session | null }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      throw error ?? new Error('Erro ao fazer login');
    }
    return { user: data.user, session: data.session };
  }

  /** Criação de conta */
  async signUp(email: string, password: string): Promise<{ user: User; session: Session | null }> {
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    if (error || !data.user) {
      throw error ?? new Error('Erro ao criar conta');
    }
    return { user: data.user, session: data.session };
  }

  /** Usuário atual, se já existir sessão */
  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) {
      console.error('Erro ao buscar usuário logado', error);
      return null;
    }
    return data.user ?? null;
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      console.error('Erro ao sair', error);
    }
  }
}
