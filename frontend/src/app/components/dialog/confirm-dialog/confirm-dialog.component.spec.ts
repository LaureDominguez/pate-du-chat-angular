import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

// ------------------------------------------------------------------
//  Spécifications – ConfirmDialogComponent
// ------------------------------------------------------------------
//  Vérifie : rendu message + libellés, actions confirm/cancel/extra
// ------------------------------------------------------------------

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let component: ConfirmDialogComponent;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ConfirmDialogComponent>>;

  const dialogData = {
    message: 'Confirmer ?',
    confirmButtonText: 'Oui',
    cancelButtonText: 'Non',
    extraButton: 'Autre',
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent], // stand‑alone
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('doit être créé', () => {
    expect(component).toBeTruthy();
  });

  it('doit afficher le message et les libellés dans le DOM', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain(dialogData.message);
    expect(el.textContent).toContain(dialogData.confirmButtonText);
    expect(el.textContent).toContain(dialogData.cancelButtonText);
    expect(el.textContent).toContain(dialogData.extraButton);
  });

  it('doit fermer avec "confirm" lorsque onConfirm() est appelé', () => {
    component.onConfirm();
    expect(dialogRefSpy.close).toHaveBeenCalledWith('confirm');
  });

  it('doit fermer avec "cancel" lorsque onCancel() est appelé', () => {
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith('cancel');
  });

  it('doit fermer avec "extra" lorsque onExtra() est appelé', () => {
    component.onExtra();
    expect(dialogRefSpy.close).toHaveBeenCalledWith('extra');
  });
});
