import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService, Collection, Link } from '../../core/services/api.service';

@Component({
  selector: 'app-colecoes-page',
  templateUrl: './colecoes-page.component.html',
  styleUrls: ['./colecoes-page.component.scss']
})
export class ColecoesPageComponent implements OnInit {
  colecoes: Collection[] = [];
  links: Link[] = [];

  colecaoForm: FormGroup;
  isModalOpen = false;
  editingCollection: Collection | null = null;
  loading = false;
  saving = false;

  // IDs de links selecionados para a coleção atual (no modal)
  selectedLinkIds = new Set<string>();

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
    this.loadLinks();
  }

  loadCollections(): void {
    this.loading = true;
    this.api.getCollections().subscribe({
      next: (list) => {
        this.colecoes = list;
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
        this.links = links;
      },
      error: (err) => {
        console.error('Erro ao carregar links', err);
      }
    });
  }

  openCreateModal(): void {
    this.isModalOpen = true;
    this.editingCollection = null;
    this.colecaoForm.reset({ visibility: 'publico' });
    this.selectedLinkIds = new Set<string>();
  }

  openEditModal(collection: Collection): void {
    this.isModalOpen = true;
    this.editingCollection = collection;

    this.colecaoForm.patchValue({
      name: collection.name,
      description: collection.description || '',
      visibility: collection.visibility || 'publico'
    });

    // Pré-seleciona os links que já pertencem a esta coleção
    this.selectedLinkIds = new Set<string>(
      this.links
        .filter((l) => l.collection_id === collection.id)
        .map((l) => String(l.id))
    );
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onToggleLinkSelection(link: Link, checked: boolean): void {
    if (!link.id) return;

    const id = String(link.id);

    if (checked) {
      this.selectedLinkIds.add(id);
    } else {
      this.selectedLinkIds.delete(id);
    }
  }

  saveCollection(): void {
    if (this.colecaoForm.invalid) {
      this.colecaoForm.markAllAsTouched();
      return;
    }

    this.saving = true;

    const payload: Partial<Collection> = this.colecaoForm.value;

    // Editar coleção existente
    if (this.editingCollection && this.editingCollection.id) {
      const collectionId = String(this.editingCollection.id);

      this.api.updateCollection(collectionId, payload).subscribe({
        next: () => {
          this.updateLinksForCollection(collectionId);
        },
        error: (err) => {
          console.error('Erro ao atualizar coleção', err);
          this.saving = false;
        }
      });
    } else {
      // Criar nova coleção
      this.api.createCollection(payload).subscribe({
        next: (created) => {
          const collectionId = String(created.id);
          this.updateLinksForCollection(collectionId);
        },
        error: (err) => {
          console.error('Erro ao criar coleção', err);
          this.saving = false;
        }
      });
    }
  }

  private updateLinksForCollection(collectionId: string): void {
    const ops = [];

    for (const link of this.links) {
      if (!link.id) continue;

      const linkId = String(link.id);
      const isSelected = this.selectedLinkIds.has(linkId);
      const isCurrentlyInCollection = link.collection_id === collectionId;

      // Caso 1: marcado e ainda não estava na coleção → adiciona
      if (isSelected && !isCurrentlyInCollection) {
        ops.push(
          this.api.updateLink(linkId, {
            collection_id: collectionId
          })
        );
      }

      // Caso 2: desmarcado e antes estava nessa coleção → remove
      if (!isSelected && isCurrentlyInCollection) {
        ops.push(
          this.api.updateLink(linkId, {
            collection_id: null
          })
        );
      }
    }

    if (ops.length === 0) {
      this.finishSave();
      return;
    }

    forkJoin(ops).subscribe({
      next: () => {
        this.finishSave();
      },
      error: (err) => {
        console.error('Erro ao atualizar links da coleção', err);
        this.finishSave();
      }
    });
  }

  private finishSave(): void {
    this.saving = false;
    this.isModalOpen = false;
    this.loadCollections();
    this.loadLinks();
  }

  deleteCollection(col: Collection): void {
    if (!col.id) return;
    if (
      !confirm(
        'Excluir esta coleção? Os links continuarão existindo, mas sem coleção.'
      )
    )
      return;

    this.api.deleteCollection(String(col.id)).subscribe({
      next: () => {
        this.loadCollections();
        this.loadLinks();
      },
      error: (err) => console.error('Erro ao excluir coleção', err)
    });
  }
}