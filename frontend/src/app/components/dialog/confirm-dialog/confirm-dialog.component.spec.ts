import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ConfirmDialogComponent>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            message: 'Confirmer cette action ?',
            confirmButtonText: 'Oui',
            cancelButtonText: 'Non',
            extraButton: 'Autre',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait fermer la boîte avec "confirm" quand on clique sur confirmer', () => {
    component.onConfirm();
    expect(dialogRefSpy.close).toHaveBeenCalledWith('confirm');
  });

  it('devrait fermer la boîte avec "cancel" quand on clique sur annuler', () => {
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith('cancel');
  });

  it('devrait fermer la boîte avec "extra" quand on clique sur extra', () => {
    component.onExtra();
    expect(dialogRefSpy.close).toHaveBeenCalledWith('extra');
  });
});
