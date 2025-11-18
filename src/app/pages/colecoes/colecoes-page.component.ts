import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService, Collection } from '../../core/services/api.service';


@Component({
  selector: 'app-colecoes-page',
  templateUrl: './colecoes-page.component.html',
  styleUrls: ['./colecoes-page.component.scss']
})
export class ColecoesPageComponent implements OnInit {
  colecoes: Collection[] = [];
  colecaoForm: FormGroup;
  isModalOpen = false;
  editingCollection: Collection | null = null;
  loading = false;

  constructor(
    private api: ApiService,
    private fb: FormBuilder
  ) {
    this.colecaoForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      visibility: ['publico', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCollections();
  }

  loadCollections(): void {
    this.loading = true;
    this.api.getCollections().subscribe({
      next: (cols) => {
        this.colecoes = cols;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar coleções', err);
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.isModalOpen = true;
    this.editingCollection = null;
    this.colecaoForm.reset({ visibility: 'publico' });
  }

  openEditModal(col: Collection): void {
    this.isModalOpen = true;
    this.editingCollection = col;
    this.colecaoForm.patchValue({
      name: col.name,
      description: col.description || '',
      visibility: col.visibility
    });
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveCollection(): void {
    if (this.colecaoForm.invalid) {
      this.colecaoForm.markAllAsTouched();
      return;
    }

    const payload: Partial<Collection> = this.colecaoForm.value;

    if (this.editingCollection && this.editingCollection.id) {
      this.api.updateCollection(this.editingCollection.id, payload).subscribe({
        next: () => {
          this.loadCollections();
          this.closeModal();
        },
        error: (err) => console.error('Erro ao atualizar coleção', err)
      });
    } else {
      this.api.createCollection(payload).subscribe({
        next: () => {
          this.loadCollections();
          this.closeModal();
        },
        error: (err) => console.error('Erro ao criar coleção', err)
      });
    }
  }

  deleteCollection(col: Collection): void {
    if (!col.id) return;
    if (
      !confirm(
        'Deseja realmente excluir esta coleção? Os links continuarão existindo, mas sem coleção.'
      )
    ) {
      return;
    }

    this.api.deleteCollection(col.id).subscribe({
      next: () => {
        this.loadCollections();
      },
      error: (err) => console.error('Erro ao excluir coleção', err)
    });
  }
}
