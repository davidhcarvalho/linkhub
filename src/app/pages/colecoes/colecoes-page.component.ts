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

  // Links selecionados na coleção em edição
  selectedLinkIds: string[] = [];

  // Modal de visualizar links da coleção
  showLinksModal = false;
  currentCollection: Collection | null = null;
  currentCollectionLinks: Link[] = [];

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

        if (this.currentCollection) {
          this.currentCollectionLinks = this.links.filter(
            (l) => l.collection_id === this.currentCollection!.id
          );
        }
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

    this.selectedLinkIds = this.links
      .filter((l) => l.collection_id === c.id)
      .map((l) => l.id!)
      .filter(Boolean);
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  isLinkSelected(link: Link): boolean {
    return !!link.id && this.selectedLinkIds.includes(link.id);
  }

  /**
   * Seleção de links dentro do modal.
   * Opção B: se o link já está em outra coleção, pergunta se deseja mover.
   * Se o usuário cancelar, o checkbox volta ao estado anterior.
   */
  toggleLinkSelection(link: Link, event: Event): void {
    const input = event.target as HTMLInputElement;
    const checked = input.checked;
    const id = link.id;
    if (!id) return;

    if (!checked) {
      // Desmarcando: só remove da seleção
      this.selectedLinkIds = this.selectedLinkIds.filter((x) => x !== id);
      return;
    }

    // Marcando: verificar se já pertence a outra coleção
    const currentCollectionId = this.editingCollection?.id || null;
    const existingCollectionId = link.collection_id || null;

    if (existingCollectionId && existingCollectionId !== currentCollectionId) {
      const existingCollection = this.collections.find(
        (c) => c.id === existingCollectionId
      );
      const existingName = existingCollection?.name || 'outra coleção';

      const mensagem = this.editingCollection
        ? `Este link já pertence à coleção "${existingName}". Deseja mover para "${this.editingCollection.name}"?`
        : `Este link já pertence à coleção "${existingName}". Ao salvar, ele será movido para esta nova coleção. Deseja continuar?`;

      const confirmou = window.confirm(mensagem);
      if (!confirmou) {
        // volta visualmente para o estado anterior
        input.checked = this.isLinkSelected(link);
        return;
      }
      // Se confirmou, segue normal – o movimento real é feito em saveCollectionLinks()
    }

    if (!this.selectedLinkIds.includes(id)) {
      this.selectedLinkIds.push(id);
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
   * Se o link estava em outra coleção, ele é movido para esta.
   */
  private saveCollectionLinks(collectionId: string): void {
    const updates = this.links.map((link) => {
      if (!link.id) return of(null);

      const shouldBelong = this.selectedLinkIds.includes(link.id);
      const currentlyBelongs = link.collection_id === collectionId;

      if (shouldBelong === currentlyBelongs) {
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

  linksInCollection(c: Collection): number {
    return this.links.filter((l) => l.collection_id === c.id).length;
  }

  /* MODAL PARA VER OS LINKS DA COLEÇÃO */

  openCollectionLinks(c: Collection): void {
    this.currentCollection = c;
    this.currentCollectionLinks = this.links.filter(
      (l) => l.collection_id === c.id
    );
    this.showLinksModal = true;
  }

  closeCollectionLinksModal(): void {
    this.showLinksModal = false;
  }

  async copyShortUrl(link: Link): Promise<void> {
    const value = link.short_url || link.url;
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      alert('URL copiada para a área de transferência!');
    } catch (err) {
      console.error('Erro ao copiar URL', err);
    }
  }

  deleteLinkFromCollection(link: Link): void {
    if (!link.id) return;
    if (!confirm('Deseja realmente excluir este link?')) return;

    this.api.deleteLink(link.id).subscribe({
      next: () => {
        this.loadLinks();
        this.loadCollections();
      },
      error: (err) => console.error('Erro ao excluir link', err)
    });
  }
}
