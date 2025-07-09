import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminComponent } from './admin.component';
// import { AdminModule } from './admin.module';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ADMIN_SHARED_IMPORTS } from './admin-material';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminComponent, 
        ADMIN_SHARED_IMPORTS
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('devrait initialiser les 4 panneaux', () => {
    expect(component.panels.length).toBe(4);
  });

  it('devrait activer un panneau lorsqu\'on clique sur une tuile', () => {
    const key = 'products';
    component.togglePanel(key);
    expect(component.activePanel).toBe(key);
  });

  it('devrait désactiver le panneau si on reclique dessus', () => {
    component.togglePanel('products');
    component.togglePanel('products');
    expect(component.activePanel).toBeNull();
  });

  it('isSolo() devrait retourner true si un autre panneau est actif', () => {
    component.activePanel = 'ingredients';
    expect(component.isSolo('products')).toBeTrue();
    expect(component.isSolo('ingredients')).toBeFalse();
  });

  it('isActivePanel() devrait retourner true uniquement pour le panneau actif', () => {
    component.activePanel = 'suppliers';
    expect(component.isActivePanel('suppliers')).toBeTrue();
    expect(component.isActivePanel('products')).toBeFalse();
  });

  it('updatePanelCount() devrait mettre à jour le compteur du panneau ciblé', (done) => {
    component.updatePanelCount('categories', 7);
    setTimeout(() => {
      const panel = component.panels.find(p => p.key === 'categories');
      expect(panel?.count).toBe(7);
      done();
    });
  });

  it('closePanel() devrait désactiver le panneau actif', () => {
    const fakeEvent = new MouseEvent('click');
    spyOn(fakeEvent, 'stopPropagation');
    component.activePanel = 'suppliers';
    component.closePanel(fakeEvent);
    expect(component.activePanel).toBeNull();
    expect(fakeEvent.stopPropagation).toHaveBeenCalled();
  });
});
