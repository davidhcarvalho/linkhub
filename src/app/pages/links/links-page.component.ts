import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService, Link } from '../../core/services/api.service';

@Component({
  selector: 'app-links-page',
  templateUrl: './links-page.component.html',
  styleUrls: ['./links-page.component.scss']
})
export class LinksPageComponent implements OnInit {
  links: Link[] = [];
  linkForm: FormGroup;
  isModalOpen = false;
  editingLink: Link | null = null;
  loading = false;
  saving = false;

  constructor(
    private api: ApiService,
    private fb: FormBuilder
  ) {
    this.linkForm = this.fb.group({
      title: ['', Validators.required],
      url: ['', [Validators.required]],
      tagsText: [''],
      collection_id: [null]
    });
  }

  ngOnInit(): void {
    this.loadLinks();
  }

  loadLinks(): void {
    this.loading = true;
    this.api.getLinks().subscribe({
      next: (links) => {
        this.links = links;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar links', err);
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.isModalOpen = true;
    this.editingLink = null;
    this.linkForm.reset();
  }

  openEditModal(link: Link): void {
    this.isModalOpen = true;
    this.editingLink = link;
    this.linkForm.patchValue({
      title: link.title,
      url: link.url,
      tagsText: link.tags?.join(', ') || '',
      collection_id: link.collection_id || null
    });
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveLink(): void {
    if (this.linkForm.invalid) {
      this.linkForm.markAllAsTouched();
      return;
    }

    this.saving = true;

    const formValue = this.linkForm.value;
    const tags =
      formValue.tagsText
        ?.split(',')
        .map((t: string) => t.trim())
        .filter((t: string) => !!t) || [];

    const payload: Partial<Link> = {
      title: formValue.title,
      url: formValue.url,
      tags,
      collection_id: formValue.collection_id
    };

    if (this.editingLink && this.editingLink.id) {
      this.api.updateLink(this.editingLink.id, payload).subscribe({
        next: () => {
          this.saving = false;
          this.loadLinks();
          this.closeModal();
        },
        error: (err) => {
          this.saving = false;
          console.error('Erro ao atualizar link', err);
        }
      });
    } else {
      this.api.createLink(payload).subscribe({
        next: () => {
          this.saving = false;
          this.loadLinks();
          this.closeModal();
        },
        error: (err) => {
          this.saving = false;
          console.error('Erro ao criar link', err);
        }
      });
    }
  }

  deleteLink(link: Link): void {
    if (!link.id) return;
    if (!confirm('Deseja realmente excluir este link?')) return;

    this.api.deleteLink(link.id).subscribe({
      next: () => {
        this.loadLinks();
      },
      error: (err) => console.error('Erro ao excluir link', err)
    });
  }

  async copyShortUrl(link: Link): Promise<void> {
    const urlToCopy = link.short_url || link.url;

    try {
      await navigator.clipboard.writeText(urlToCopy);
      alert('URL copiada para a área de transferência!');
    } catch (err) {
      console.error('Erro ao copiar URL', err);
    }
  }
}
