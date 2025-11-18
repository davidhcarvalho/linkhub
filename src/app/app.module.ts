import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { AuthPageComponent } from './pages/auth/auth-page.component';
import { DashboardPageComponent } from './pages/dashboard/dashboard-page.component';
import { LinksPageComponent } from './pages/links/links-page.component';
import { ColecoesPageComponent } from './pages/colecoes/colecoes-page.component';
import { MainLayoutComponent } from './pages/layout/main-layout.component';

@NgModule({
  declarations: [
    AppComponent,
    AuthPageComponent,
    DashboardPageComponent,
    LinksPageComponent,
    ColecoesPageComponent,
    MainLayoutComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}