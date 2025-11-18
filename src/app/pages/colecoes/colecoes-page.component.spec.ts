import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColecoesPageComponent } from './colecoes-page.component';

describe('ColecoesPageComponent', () => {
  let component: ColecoesPageComponent;
  let fixture: ComponentFixture<ColecoesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColecoesPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ColecoesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
