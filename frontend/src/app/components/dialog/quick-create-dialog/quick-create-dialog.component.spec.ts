import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuickCreateDialogComponent } from './quick-create-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';

// ------------------------------------------------------------------
//  Spécifications – QuickCreateDialogComponent
// ------------------------------------------------------------------
//  Vérifie : génération dynamique du form, validation, save/cancel behaviour
// ------------------------------------------------------------------

describe('QuickCreateDialogComponent', () => {
  let fixture: ComponentFixture<QuickCreateDialogComponent>;
  let component: QuickCreateDialogComponent;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<QuickCreateDialogComponent>>;

  const dialogData = {
    title: 'Ajouter catégorie',
    fields: [
      {
        name: 'name',
        label: 'Nom',
        required: true,
        maxLength: 20,
        defaultValue: 'Pâtes',
      },
      {
        name: 'description',
        label: 'Description',
      },
    ],
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [QuickCreateDialogComponent, ReactiveFormsModule],
      providers: [
        provideAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuickCreateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ---------------------------------------------------------------
  //  Création & structure du form
  // ---------------------------------------------------------------
  it('doit être créé', () => {
    expect(component).toBeTruthy();
  });

  it('doit construire un formulaire dynamique avec les bons contrôles', () => {
    expect(component.form.contains('name')).toBeTrue();
    expect(component.form.contains('description')).toBeTrue();
    expect(component.form.get('name')!.value).toBe('Pâtes');
  });

  // ---------------------------------------------------------------
  //  save()
  // ---------------------------------------------------------------
  it('doit fermer avec les valeurs du form si valide', () => {
    component.form.setValue({ name: 'Ravioli', description: 'Farce' });
    component.save();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ name: 'Ravioli', description: 'Farce' });
  });

  it('ne doit pas fermer si formulaire invalide et doit marquer comme touché', () => {
    component.form.get('name')!.setValue(''); // champ requis vide
    component.save();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
    expect(component.form.get('name')!.touched).toBeTrue();
  });

  // ---------------------------------------------------------------
  //  cancel()
  // ---------------------------------------------------------------
  it('doit fermer avec null lors de cancel()', () => {
    component.cancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
  });
});
