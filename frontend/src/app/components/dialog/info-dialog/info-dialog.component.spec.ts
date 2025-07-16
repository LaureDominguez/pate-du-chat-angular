import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfoDialogComponent } from './info-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

// ------------------------------------------------------------------
//  Spécifications – InfoDialogComponent (stand‑alone)
// ------------------------------------------------------------------
//  Vérifie : création, injection des données, rendu titre + message, bouton
// ------------------------------------------------------------------

describe('InfoDialogComponent', () => {
  let fixture: ComponentFixture<InfoDialogComponent>;
  let component: InfoDialogComponent;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<InfoDialogComponent>>;

  const dialogData = {
    message: 'Message de test',
    title: 'Titre test',
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [InfoDialogComponent], // stand‑alone component
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ---------------------------------------------------------------
  //  Base
  // ---------------------------------------------------------------
  it('doit être créé', () => {
    expect(component).toBeTruthy();
  });

  it('doit exposer les données injectées', () => {
    expect(component.data.message).toBe(dialogData.message);
    expect(component.data.title).toBe(dialogData.title);
  });

  // ---------------------------------------------------------------
  //  Rendu du template
  // ---------------------------------------------------------------
  it('doit afficher le titre et le message dans le DOM', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain(dialogData.message);
    expect(el.textContent).toContain(dialogData.title);
  });

  // ---------------------------------------------------------------
  //  Interaction – bouton Fermer
  // ---------------------------------------------------------------
  it('doit fermer la boîte de dialogue lors du clic sur le bouton', () => {
    const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();

    btn!.click();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });
});
