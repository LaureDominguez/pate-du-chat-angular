import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuickCreateDialogComponent } from './quick-create-dialog.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

describe('QuickCreateDialogComponent', () => {
  let component: QuickCreateDialogComponent;
  let fixture: ComponentFixture<QuickCreateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        QuickCreateDialogComponent
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
            title: 'Quick Create Test',
            fields: [
              { name: 'name', label: 'Name', required: true, maxLength: 50 },
              { name: 'description', label: 'Description' }
            ]
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickCreateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait initialiser les champs du formulaire en fonction des champs de données', () => {
    const nameControl = component.form.get('name');
    const descriptionControl = component.form.get('description');
    expect(nameControl).toBeTruthy();
    expect(descriptionControl).toBeTruthy();
  });

  it('doit fermer le dialogue avec les valeurs du formulaire si valide', () => {
    const dialogRef = TestBed.inject(MatDialogRef);
    component.form.get('name')?.setValue('Test Name');
    component.save();
    expect(dialogRef.close).toHaveBeenCalledWith({ name: 'Test Name', description: '' });
  });

  it('doit marquer les champs comme touchés si le formulaire est invalide à la sauvegarde', () => {
    const dialogRef = TestBed.inject(MatDialogRef);
    component.save();
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.form.get('name')?.touched).toBeTrue();
  });

  it('doit fermer le dialogue avec null si annulation', () => {
    const dialogRef = TestBed.inject(MatDialogRef);
    component.cancel();
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });
});
