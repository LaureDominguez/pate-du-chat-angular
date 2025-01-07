import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface UploadResponse {
  message: string;
  imagePath: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private baseUrl = 'http://localhost:5000/api/images';
  private uploadUrl = 'http://localhost:5000/uploads';

  constructor(private http: HttpClient) {}

  uploadImages(image: File[]): Observable<UploadResponse> {
    const formData = new FormData();
    image.forEach((file) => {
      formData.append('images', file);
    });
    console.log(
      'image.service -> FormData Keys:',
      Array.from((formData as any).keys())
    );
    console.log(
      'image.service -> FormData Values:',
      Array.from((formData as any).values())
    );
    return this.http.post<UploadResponse>(`${this.baseUrl}`, formData);
  }

  getImageUrl(imagePath: string): string {
    const cleanPath = imagePath.replace(/^\/?uploads\/?/, '');
    return `${this.uploadUrl}/${cleanPath}`;
  }

  deleteImage(imagePath: string): Observable<{ message: string }> {
    const cleanPath = imagePath.replace(/^\/?uploads\/?/, '');
    const url = `${this.baseUrl}/${cleanPath}`;
    console.log('image.service :', url);
    return this.http.delete<{ message: string }>(url);
  }
}
