import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageCarouselComponent } from './image-carousel.component';
import { DragDropModule } from '@angular/cdk/drag-drop';

describe('ImageCarouselComponent', () => {
  let component: ImageCarouselComponent;
  let fixture: ComponentFixture<ImageCarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ImageCarouselComponent,
        DragDropModule
      ],
      providers: [],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });
});
