// src/app/components/dialog/quick-create-dialog/quick-create-dialog.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuickCreateDialogComponent } from './quick-create-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('QuickCreateDialogComponent', () => {
  let component: QuickCreateDialogComponent;
  let fixture: ComponentFixture<QuickCreateDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<QuickCreateDialogComponent>>;

  const mockData = {
    title: 'Ajouter une catégorie',
    fields: [
      {
        name: 'name',
        label: 'Nom',
        required: true,
        maxLength: 20,
        defaultValue: 'Pâtes'
      },
      {
        name: 'description',
        label: 'Description',
        required: false
      }
    ]
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [QuickCreateDialogComponent, ReactiveFormsModule],
      providers: [
        // provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(QuickCreateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait construire un formulaire avec les bons champs', () => {
    expect(component.form.contains('name')).toBeTrue();
    expect(component.form.contains('description')).toBeTrue();
    expect(component.form.get('name')?.value).toBe('Pâtes');
  });

  it('devrait fermer la boîte de dialogue avec les données si le formulaire est valide', () => {
    component.form.setValue({ name: 'Raviolis', description: 'Farce maison' });
    component.save();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({
      name: 'Raviolis',
      description: 'Farce maison'
    });
  });

  it('ne devrait pas fermer la boîte de dialogue si le formulaire est invalide', () => {
    component.form.get('name')?.setValue(''); // champ requis vidé
    component.save();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
    expect(component.form.get('name')?.touched).toBeTrue();
  });

  it('devrait fermer la boîte de dialogue avec null en cas d’annulation', () => {
    component.cancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
  });
});
