import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AdminModule } from '../admin.module';
import { AppModule } from '../../../app.module';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

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
  @Input() existingImages: string[] = [];
  @Input() previewImages: string[]= [];

  @Output() removeExisting = new EventEmitter<number>();
  @Output() removePreview = new EventEmitter<number>();
  @Output() download = new EventEmitter<string>();
  @Output() reorderExisting = new EventEmitter<string[]>();
  @Output() reorderPreview = new EventEmitter<string[]>();

  selectedImage: string | null = null;

  onDropExisting(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.existingImages, event.previousIndex, event.currentIndex);
    this.reorderExisting.emit(this.existingImages);
  }

  onDropPreview(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.previewImages, event.previousIndex, event.currentIndex);
    this.reorderPreview.emit(this.previewImages);
  }

  zoom(image: string) {
    this.selectedImage = image;
  }

  closeZoom() {
    this.selectedImage = null;
  }
}
