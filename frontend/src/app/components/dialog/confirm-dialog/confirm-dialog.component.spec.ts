import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDialogComponent } from './confirm-dialog.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ConfirmDialogComponent,
        CommonModule,
        MatButtonModule,
        MatDialogModule,
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
            message: 'Êtes-vous sur de vouloir continuer?',
            confirmButtonText: 'Valider',
            cancelButtonText: 'Annuler',
            extraButton: 'Extra'
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('doit appeler dialogRef.close avec "confirm" en cas de confirmation', () => {
    const dialogRef = TestBed.inject(MatDialogRef);
    component.onConfirm();
    expect(dialogRef.close).toHaveBeenCalledWith('confirm');
  });

  it('doit appeler dialogRef.close avec "cancel" en cas d\'annulation', () => {
    const dialogRef = TestBed.inject(MatDialogRef);
    component.onCancel();
    expect(dialogRef.close).toHaveBeenCalledWith('cancel');
  });

  it('doit appeler dialogRef.close avec "extra" si le bouton extra est utilisé', () => {
    const dialogRef = TestBed.inject(MatDialogRef);
    component.onExtra();
    expect(dialogRef.close).toHaveBeenCalledWith('extra');
  });
});
