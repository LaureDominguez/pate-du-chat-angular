import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom, Observable, throwError } from 'rxjs';

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
    return this.http.post<UploadResponse>(`${this.baseUrl}`, formData);
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) {
      console.error('❌ Chemin d\'image vide.');
      return '';
    }
    const cleanPath = imagePath.replace(/^\/?uploads\/?/, '');
    return cleanPath.startsWith('http') ? cleanPath : `${this.baseUrl}/${cleanPath}`;
  }

  async downloadImage(
    imagePath: string,
    customFilename: string
  ): Promise<void> {
    try {
      let cleanPath = imagePath;

      if (/^https?:\/\//.test(imagePath)) {
        cleanPath = new URL(imagePath).pathname;
      }

      cleanPath =
        cleanPath
          .replace(/^\/?uploads\/?/, '')
          .split('/')
          .pop() || '';

      if (!cleanPath) {
        console.error(
          '❌ Impossible de récupérer le nom de fichier depuis:',
          imagePath
        );
        return;
      }

      const url = `${this.baseUrl}/${cleanPath}`;
      const blob = await lastValueFrom(
        this.http.get(url, { responseType: 'blob' })
      );
      const extension = cleanPath.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const safeFilename = customFilename.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${safeFilename}_${timestamp}.${extension}`;

      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(objectUrl);

    } catch (error) {
      console.error('❌ Erreur lors du téléchargement de l’image:', error);
    }
  }

  deleteImage(imagePath: string): Observable<{ message: string }> {
    if (!imagePath) {
      console.error('❌ Chemin d\'image vide pour suppression.');
      return throwError(() => new Error('Chemin d\'image vide.'));
    }
    const cleanPath = imagePath.replace(/^\/?uploads\/?/, '');
    const url = `${this.baseUrl}/${cleanPath}`;
    return this.http.delete<{ message: string }>(url);
  }
}
