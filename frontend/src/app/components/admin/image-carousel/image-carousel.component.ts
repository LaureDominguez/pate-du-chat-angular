import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { AdminModule } from '../admin.module';
import { AppModule } from '../../../app.module';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ProcessedImage } from '../../../models/image';
import { ImageService } from '../../../services/image.service';

@Component({
  selector: 'app-image-carousel',
  imports: [
    AdminModule,
    AppModule
  ],
  templateUrl: './image-carousel.component.html',
  styleUrls: ['./image-carousel.component.scss']
})
export class ImageCarouselComponent implements OnChanges {
  // @Input() existingImages: string[] = [];
  // @Input() previewImages: string[]= [];

  // @Output() removeExisting = new EventEmitter<number>();
  // @Output() removePreview = new EventEmitter<number>();
  // @Output() download = new EventEmitter<string>();
  // @Output() reorderExisting = new EventEmitter<string[]>();
  // @Output() reorderPreview = new EventEmitter<string[]>();

  
  @Input() images: ProcessedImage[] = [];

  @Output() reorder = new EventEmitter<ProcessedImage[]>();
  @Output() remove = new EventEmitter<ProcessedImage>();
  @Output() download = new EventEmitter<string>();

  selectedImage: string | null = null;

  constructor(private imageService: ImageService) {}

  ngOnChanges() {
    console.log('🎠 Images reçues :', this.images);
  }
  

  onDrop(event: CdkDragDrop<ProcessedImage[]>) {
    moveItemInArray(this.images, event.previousIndex, event.currentIndex);
    this.reorder.emit(this.images);
  }

  zoom(image: string) {
    this.selectedImage = image;
  }

  closeZoom() {
    this.selectedImage = null;
  }

  isPreview(image: ProcessedImage): boolean {
    return image.type === 'preview';
  }

  // onDropExisting(event: CdkDragDrop<string[]>) {
  //   moveItemInArray(this.existingImages, event.previousIndex, event.currentIndex);
  //   this.reorderExisting.emit(this.existingImages);
  // }

  // onDropPreview(event: CdkDragDrop<string[]>) {
  //   moveItemInArray(this.previewImages, event.previousIndex, event.currentIndex);
  //   this.reorderPreview.emit(this.previewImages);
  // }

  // zoom(image: string) {
  //   this.selectedImage = image;
  // }

  // closeZoom() {
  //   this.selectedImage = null;
  // }
}
