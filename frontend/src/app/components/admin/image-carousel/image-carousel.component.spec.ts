import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  flush,
} from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { ImageCarouselComponent } from './image-carousel.component';
import { ProcessedImage } from '../../../models/image';

/* ------------------------------------------------------------------
  stub requestAnimationFrame → exécution immédiate
------------------------------------------------------------------- */
beforeAll(() => {
  spyOn(window, 'requestAnimationFrame').and.callFake((cb) => {
    cb(0);
    return 0;
  });
});

describe('ImageCarouselComponent', () => {
  let fixture: ComponentFixture<ImageCarouselComponent>;
  let component: ImageCarouselComponent;

  const mockImages: ProcessedImage[] = [
    { type: 'existing', data: 'url1', path: '/up/1.jpg' },
    { type: 'preview', data: 'b64', file: new File([], '2.jpg') },
    { type: 'existing', data: 'url3', path: '/up/3.jpg' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageCarouselComponent, DragDropModule],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageCarouselComponent);
    component = fixture.componentInstance;
    component.images = [...mockImages];
    fixture.detectChanges();
  });

  /* ------------------------------------------------------------------
    1. création et ngAfterViewInit
  ------------------------------------------------------------------ */
  it('doit créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('doit initialiser un contrôleur autoAnimate si carouselRef existe', () => {
    const enableSpy  = jasmine.createSpy('enable');
    const disableSpy = jasmine.createSpy('disable');

    /* 1️⃣  faux élément DOM + set ViewChild */
    component.carouselRef = {
      nativeElement: document.createElement('div')
    } as any;

    /* 2️⃣  faux contrôleur branché directement */
    (component as any).controller = { enable: enableSpy, disable: disableSpy };

    /* 3️⃣  appels à tester */
    component.disableAnimation();
    component.enableAnimation();

    expect(disableSpy).toHaveBeenCalled();
    expect(enableSpy).toHaveBeenCalled();
  });

  it('doit ne pas planter si carouselRef est absent', () => {
    component.carouselRef = undefined as any;
    expect(() => component.ngAfterViewInit()).not.toThrow();
  });

  /* ------------------------------------------------------------------
    2. Survol différé (hoverTimeout)
  ------------------------------------------------------------------ */
  it('doit activer les contrôles après 300 ms de hover', fakeAsync(() => {
    component.onMouseEnter(1);
    tick(299);
    expect(component.activeControlIndex).toBeNull();
    tick(1);
    expect(component.activeControlIndex).toBe(1);
  }));

  it('doit annuler le hover si mouseLeave avant 300 ms', fakeAsync(() => {
    component.onMouseEnter(0);
    tick(150);
    component.onMouseLeave();
    tick(200);
    expect(component.activeControlIndex).toBeNull();
  }));

  /* ------------------------------------------------------------------
    3. toggleControls
  ------------------------------------------------------------------ */
  it('doit alterner activeControlIndex via toggleControls', () => {
    component.toggleControls(2);
    expect(component.activeControlIndex).toBe(2);
    component.toggleControls(2);
    expect(component.activeControlIndex).toBeNull();
  });

  /* ------------------------------------------------------------------
    4. moveImageLeft / moveImageRight
  ------------------------------------------------------------------ */
  it('doit émettre reorder et décrémenter l’index avec moveImageLeft', fakeAsync(() => {
    spyOn(component.reorder, 'emit');
    component.moveImageLeft(2); // index 2 → 1
    flush();
    expect(component.reorder.emit).toHaveBeenCalledWith(component.images);
    expect(component.activeControlIndex).toBe(1);
  }));

  it('doit ignorer moveImageLeft si index = 0', fakeAsync(() => {
    spyOn(component.reorder, 'emit');
    component.moveImageLeft(0);
    flush();
    expect(component.reorder.emit).not.toHaveBeenCalled();
  }));

  it('doit émettre reorder et incrémenter l’index avec moveImageRight', fakeAsync(() => {
    spyOn(component.reorder, 'emit');
    component.moveImageRight(0); // 0 → 1
    flush();
    expect(component.reorder.emit).toHaveBeenCalledWith(component.images);
    expect(component.activeControlIndex).toBe(1);
  }));

  it('doit ignorer moveImageRight si index = last', fakeAsync(() => {
    spyOn(component.reorder, 'emit');
    component.moveImageRight(component.images.length - 1);
    flush();
    expect(component.reorder.emit).not.toHaveBeenCalled();
  }));

  /* ------------------------------------------------------------------
    5. removeImage
  ------------------------------------------------------------------ */
  it('doit émettre remove lorsqu’une image est supprimée', () => {
    spyOn(component.remove, 'emit');
    component.removeImage(mockImages[0]);
    expect(component.remove.emit).toHaveBeenCalledWith(mockImages[0]);
  });

  /* ------------------------------------------------------------------
    6. zoom / closeZoom
  ------------------------------------------------------------------ */
  it('doit gérer zoom et closeZoom', () => {
    component.zoom('url1');
    expect(component.selectedImage).toBe('url1');
    component.closeZoom();
    expect(component.selectedImage).toBeNull();
  });

  /* ------------------------------------------------------------------
    7. isPreview
  ------------------------------------------------------------------ */
  it('doit retourner true pour un type preview', () => {
    expect(component.isPreview(mockImages[1])).toBeTrue();
  });

  it('doit retourner false pour un type existing', () => {
    expect(component.isPreview(mockImages[0])).toBeFalse();
  });

  /* ------------------------------------------------------------------
    8. onDrop (CdkDragDrop)
  ------------------------------------------------------------------ */
  it('doit réordonner et émettre reorder dans onDrop', fakeAsync(() => {
    spyOn(component.reorder, 'emit');
    const event = { previousIndex: 0, currentIndex: 2 } as any;
    component.onDrop(event);
    flush();
    expect(component.reorder.emit).toHaveBeenCalledWith(component.images);
    expect(component.activeControlIndex).toBe(2);
  }));
});
