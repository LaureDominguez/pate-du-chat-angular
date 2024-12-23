import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private baseUrl = 'http://localhost:5000/uploads';

  constructor(private http: HttpClient) { }

  getImageUrl(imagePath: string): string {
      const cleanPath = imagePath.replace(/^\/?uploads\/?/, '');
      return `${this.baseUrl}/${cleanPath}`;
  }
}
