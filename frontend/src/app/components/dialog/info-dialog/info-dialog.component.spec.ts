import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoDialogComponent } from './info-dialog.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

describe('InfoDialogComponent', () => {
  let component: InfoDialogComponent;
  let fixture: ComponentFixture<InfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        MatButtonModule,
        MatDialogModule,
        InfoDialogComponent
      ],
      providers: [
        {
          provide: MatDialogRef,
          useValue: {
            close: jasmine.createSpy('close')
          }
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            message: 'Ceci est un message d\'information.',
            type: 'info'
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait afficher "Information" comme titre pour un type "info"', () => {
    expect(component.title).toBe('Information');
  });

  it('devrait afficher "Erreur" comme titre pour un type "error"', () => {
    component.data.type = 'error';
    component.ngOnInit();
    expect(component.title).toBe('Erreur');
  });

  it('devrait afficher "Succès" comme titre pour un type "success"', () => {
    component.data.type = 'success';
    component.ngOnInit();
    expect(component.title).toBe('Succès');
  });
});
