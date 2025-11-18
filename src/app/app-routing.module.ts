import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthPageComponent } from './pages/auth/auth-page.component';
import { DashboardPageComponent } from './pages/dashboard/dashboard-page.component';
import { LinksPageComponent } from './pages/links/links-page.component';
import { ColecoesPageComponent } from './pages/colecoes/colecoes-page.component';
import { AuthGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './pages/layout/main-layout.component';

const routes: Routes = [
  { path: 'login', component: AuthPageComponent },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'links', component: LinksPageComponent },
      { path: 'colecoes', component: ColecoesPageComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}