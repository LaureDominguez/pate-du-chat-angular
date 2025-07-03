import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ImageCarouselComponent } from './image-carousel.component';
import { ProcessedImage } from '../../../models/image';
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AdminModule } from '../admin.module';

describe('ImageCarouselComponent', () => {
  let component: ImageCarouselComponent;
  let fixture: ComponentFixture<ImageCarouselComponent>;

  const mockImages: ProcessedImage[] = [
    { type: 'existing', data: 'url1', path: '/uploads/img1.jpg' },
    { type: 'preview', data: 'base64data1', file: new File([], 'img2.jpg') }
  ];

  beforeEach(async () => {
    spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    await TestBed.configureTestingModule({
      imports: [
        ImageCarouselComponent,
        AdminModule,
        // BrowserAnimationsModule,
        DragDropModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ImageCarouselComponent);
    component = fixture.componentInstance;
    component.images = [...mockImages];
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

    it('devrait définir activeControlIndex après survol (focus différé)', fakeAsync(() => {
    // Simuler le survol de l’image à l’index 0
    component.onMouseEnter(0);
    tick(300); // attendre les 300 ms
    expect(component.activeControlIndex).toBe(0);
  }));

  it('devrait annuler le focus si la souris quitte avant 300ms', fakeAsync(() => {
    component.onMouseEnter(1);
    tick(150); // partiellement écoulé
    component.onMouseLeave(); // quitte avant les 300 ms
    tick(200); // on attend encore pour être sûr
    expect(component.activeControlIndex).toBeNull();
  }));

  it('devrait émettre un événement remove quand removeImage est appelé', () => {
    spyOn(component.remove, 'emit');
    component.removeImage(mockImages[0]);
    expect(component.remove.emit).toHaveBeenCalledWith(mockImages[0]);
  });

  it('devrait émettre reorder après moveImageLeft', fakeAsync(() => {
    spyOn(component.reorder, 'emit');
    component.moveImageLeft(1);
    tick();
    expect(component.reorder.emit).toHaveBeenCalledWith(jasmine.any(Array));
  }));

  it('devrait émettre reorder après moveImageRight', fakeAsync(() => {
    spyOn(component.reorder, 'emit');
    component.moveImageRight(0);
    tick();
    expect(component.reorder.emit).toHaveBeenCalledWith(jasmine.any(Array));
  }));

  it('devrait définir selectedImage avec zoom', () => {
    component.zoom('url1');
    expect(component.selectedImage).toBe('url1');
  });

  it('devrait réinitialiser selectedImage avec closeZoom', () => {
    component.selectedImage = 'test';
    component.closeZoom();
    expect(component.selectedImage).toBeNull();
  });

  it('devrait retourner true pour un type preview', () => {
    const preview: ProcessedImage = { type: 'preview', data: 'previewData', file: new File([], 'img') };
    expect(component.isPreview(preview)).toBeTrue();
  });

  it('ne doit pas planter si carouselRef est vide dans ngAfterViewInit', () => {
    const fakeElement = document.createElement('div');
    component.carouselRef = { nativeElement: fakeElement } as any;
    expect(() => component.ngAfterViewInit()).not.toThrow();
  });
});
