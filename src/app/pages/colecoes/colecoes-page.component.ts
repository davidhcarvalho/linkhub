import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService, Collection, Link } from '../../core/services/api.service';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-colecoes-page',
  templateUrl: './colecoes-page.component.html',
  styleUrls: ['./colecoes-page.component.scss']
})
export class ColecoesPageComponent implements OnInit {
  collections: Collection[] = [];
  links: Link[] = [];

  collectionForm: FormGroup;
  isModalOpen = false;
  editingCollection: Collection | null = null;
  loading = false;
  saving = false;

  // ids dos links selecionados na coleção sendo editada
  selectedLinkIds: string[] = [];

  constructor(
    private api: ApiService,
    private fb: FormBuilder
  ) {
    this.collectionForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      visibility: ['publico', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCollections();
    this.loadLinks();
  }

  loadCollections(): void {
    this.loading = true;
    this.api.getCollections().subscribe({
      next: (data) => {
        this.collections = data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar coleções', err);
        this.loading = false;
      }
    });
  }

  loadLinks(): void {
    this.api.getLinks().subscribe({
      next: (links) => {
        this.links = links || [];
      },
      error: (err) => {
        console.error('Erro ao carregar links', err);
      }
    });
  }

  openCreateModal(): void {
    this.isModalOpen = true;
    this.editingCollection = null;
    this.selectedLinkIds = [];
    this.collectionForm.reset({
      name: '',
      description: '',
      visibility: 'publico'
    });
  }

  openEditModal(c: Collection): void {
    this.isModalOpen = true;
    this.editingCollection = c;

    this.collectionForm.patchValue({
      name: c.name,
      description: c.description || '',
      visibility: c.visibility || 'publico'
    });

    // marca como selecionados os links que já pertencem a esta coleção
    this.selectedLinkIds = this.links
      .filter((l) => l.collection_id === c.id)
      .map((l) => l.id!)
      .filter(Boolean);
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  isLinkSelected(link: Link): boolean {
    return this.selectedLinkIds.includes(link.id!);
  }

  toggleLinkSelection(link: Link, checked: boolean): void {
    const id = link.id;
    if (!id) return;

    if (checked) {
      if (!this.selectedLinkIds.includes(id)) {
        this.selectedLinkIds.push(id);
      }
    } else {
      this.selectedLinkIds = this.selectedLinkIds.filter((x) => x !== id);
    }
  }

  saveCollection(): void {
    if (this.collectionForm.invalid) {
      this.collectionForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const payload = this.collectionForm.value;

    if (this.editingCollection && this.editingCollection.id) {
      const collectionId = this.editingCollection.id;

      this.api.updateCollection(collectionId, payload).subscribe({
        next: () => {
          this.saveCollectionLinks(collectionId);
        },
        error: (err) => {
          this.saving = false;
          console.error('Erro ao atualizar coleção', err);
        }
      });
    } else {
      this.api.createCollection(payload).subscribe({
        next: (created: Collection) => {
          const collectionId = created.id!;
          this.saveCollectionLinks(collectionId);
        },
        error: (err) => {
          this.saving = false;
          console.error('Erro ao criar coleção', err);
        }
      });
    }
  }

  /**
   * Atualiza os links para pertencerem (ou não) a esta coleção.
   * Usa updateLink alterando apenas o collection_id.
   */
  private saveCollectionLinks(collectionId: string): void {
    const updates = this.links.map((link) => {
      if (!link.id) return of(null);

      const shouldBelong = this.selectedLinkIds.includes(link.id);
      const currentlyBelongs = link.collection_id === collectionId;

      if (shouldBelong === currentlyBelongs) {
        // nada a mudar
        return of(null);
      }

      return this.api.updateLink(link.id, {
        collection_id: shouldBelong ? collectionId : null
      });
    });

    forkJoin(updates).subscribe({
      next: () => {
        this.saving = false;
        this.loadCollections();
        this.loadLinks();
        this.closeModal();
      },
      error: (err) => {
        this.saving = false;
        console.error('Erro ao atualizar links da coleção', err);
      }
    });
  }

  deleteCollection(c: Collection): void {
    if (!c.id) return;
    if (!confirm('Deseja realmente excluir esta coleção?')) return;

    this.api.deleteCollection(c.id).subscribe({
      next: () => {
        this.loadCollections();
        this.loadLinks();
      },
      error: (err) => console.error('Erro ao excluir coleção', err)
    });
  }

  // usado no card para mostrar "X links" na coleção
  linksInCollection(c: Collection): number {
    return this.links.filter((l) => l.collection_id === c.id).length;
  }
}
