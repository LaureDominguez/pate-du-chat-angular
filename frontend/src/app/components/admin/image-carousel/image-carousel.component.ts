import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { AdminModule } from '../admin.module';
import { AppModule } from '../../../app.module';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ProcessedImage } from '../../../models/image';

@Component({
  selector: 'app-image-carousel',
  imports: [
    AdminModule,
    AppModule
  ],
  templateUrl: './image-carousel.component.html',
  styleUrls: ['./image-carousel.component.scss']
})
export class ImageCarouselComponent {  
  @Input() images: ProcessedImage[] = [];

  @Output() download = new EventEmitter<string>();
  @Output() reorder = new EventEmitter<ProcessedImage[]>();
  @Output() remove = new EventEmitter<ProcessedImage>();

  selectedImage: string | null = null;
  activeControlIndex: number | null = null;
  activeControlKey: string | null = null;

  isDragging: boolean = false;



  // onDrop(event: CdkDragDrop<ProcessedImage[]>) {
  //   moveItemInArray(this.images, event.previousIndex, event.currentIndex);
  //   this.reorder.emit([...this.images]);
  // }  
onDrop(event: CdkDragDrop<ProcessedImage[]>) {
  if (event.previousIndex !== event.currentIndex) {
    moveItemInArray(this.images, event.previousIndex, event.currentIndex);
    this.reorder.emit(this.images);
    this.activeControlIndex = event.currentIndex;
  }
}

  toggleControls(index: number): void {
    this.activeControlIndex = this.activeControlIndex === index ? null : index;
    console.log('activeControlIndex', this.activeControlIndex);
  }

  moveImageLeft(index: number): void {
    if (index > 0) {
      const newImages = [...this.images];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      this.reorder.emit(newImages);
      this.activeControlIndex = index - 1; // Move the active control to the left image
    }
  }
  
  moveImageRight(index: number): void {
    if (index < this.images.length - 1) {
      const newImages = [...this.images];
      [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
      this.reorder.emit(newImages);
      this.activeControlIndex = index + 1; // Move the active control to the right image
    }
  }
  
  // toggleControls(img: ProcessedImage): void {
  //   const key = img.data;
  //   this.activeControlKey = this.activeControlKey === key ? null : key;
  //   console.log('activeControlKey', this.activeControlKey);
  // }
  
  // moveImageLeft(img: ProcessedImage): void {
  //   const index = this.images.indexOf(img);
  //   if (index > 0) {
  //     const newImages = [...this.images];
  //     [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
  //     this.reorder.emit(newImages);
  //     this.activeControlKey = newImages[index - 1].data;
  //   }
  // }
  
  // moveImageRight(img: ProcessedImage): void {
  //   const index = this.images.indexOf(img);
  //   if (index < this.images.length - 1) {
  //     const newImages = [...this.images];
  //     [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
  //     this.reorder.emit(newImages);
  //     this.activeControlKey = newImages[index + 1].data;
  //   }
  // }
  

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
