import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import { AdminModule } from '../admin.module';
import { AppModule } from '../../../app.module';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ProcessedImage } from '../../../models/image';

import autoAnimate from '@formkit/auto-animate';

@Component({
  selector: 'app-image-carousel',
  imports: [
    AdminModule,
    AppModule,
  ],
  templateUrl: './image-carousel.component.html',
  styleUrls: ['./image-carousel.component.scss'],
})
export class ImageCarouselComponent implements AfterViewInit {  
  @Input() images: ProcessedImage[] = [];

  @Output() download = new EventEmitter<string>();
  @Output() reorder = new EventEmitter<ProcessedImage[]>();
  @Output() remove = new EventEmitter<ProcessedImage>();

  @ViewChild('carouselRef') carouselRef!: ElementRef;

  private controller?: ReturnType<typeof autoAnimate>;

  selectedImage: string | null = null;
  activeControlIndex: number | null = null;
  activeControlKey: string | null = null;

  isDragging: boolean = false;

  ngAfterViewInit(): void {
    if (this.carouselRef) {
      this.controller = autoAnimate(this.carouselRef.nativeElement);
    }
  }
onDrop(event: CdkDragDrop<ProcessedImage[]>) {
  if (event.previousIndex !== event.currentIndex) {
    this.disableAnimation();
    moveItemInArray(this.images, event.previousIndex, event.currentIndex);
    this.reorder.emit(this.images);
    this.activeControlIndex = event.currentIndex;
    requestAnimationFrame(() => this.enableAnimation());
  }
}

hoverTimeout: any = null;

onMouseEnter(index: number): void {
  this.clearHoverTimeout(); // au cas où
  this.hoverTimeout = setTimeout(() => {
    this.activeControlIndex = index;
  }, 300); // 0.3 seconde
}

onMouseLeave(): void {
  this.clearHoverTimeout();
  this.activeControlIndex = null;
}

private clearHoverTimeout(): void {
  if (this.hoverTimeout) {
    clearTimeout(this.hoverTimeout);
    this.hoverTimeout = null;
  }
}


  disableAnimation() {
    console.log('disableAnimation', this.controller);
    this.controller?.disable();
  }

  enableAnimation() {
    console.log('enableAnimation', this.controller);
    this.controller?.enable();
  }

  toggleControls(index: number): void {
    this.activeControlIndex = this.activeControlIndex === index ? null : index;
  }

  moveImageLeft(index: number): void {
    if (index > 0) {
      moveItemInArray(this.images, index, index - 1); 
      requestAnimationFrame(() => {
        this.reorder.emit(this.images);
      });
      this.activeControlIndex = index - 1;
    }
  }

  moveImageRight(index: number): void {
    if (index < this.images.length - 1) {
      moveItemInArray(this.images, index, index + 1); 
      requestAnimationFrame(() => {
        this.reorder.emit(this.images);
      });
      this.activeControlIndex = index + 1;
    }
  }

  removeImage(image: ProcessedImage): void {
    this.remove.emit(image);
  }

  zoom(image: string): void {
    this.selectedImage = image;
  }

  closeZoom(): void {
    this.selectedImage = null;
  }

  isPreview(image: ProcessedImage): boolean {
    return image.type === 'preview';
  }

}
