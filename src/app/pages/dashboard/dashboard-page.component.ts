import { Component, OnInit } from '@angular/core';
import { ApiService, OverviewMetrics, Link, Collection } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent implements OnInit {
  metrics: OverviewMetrics | null = null;
  recentLinks: Link[] = [];
  recentCollections: Collection[] = [];
  loading = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    this.api.getOverviewMetrics().subscribe({
      next: (m) => {
        this.metrics = m;
      },
      error: (err) => {
        console.error('Erro ao carregar métricas', err);
      }
    });

    this.api.getLinks().subscribe({
      next: (links) => {
        this.recentLinks = links.slice(0, 5);
      },
      error: (err) => console.error('Erro ao carregar links', err)
    });

    this.api.getCollections().subscribe({
      next: (cols) => {
        this.recentCollections = cols.slice(0, 5);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar coleções', err);
        this.loading = false;
      }
    });
  }
}
