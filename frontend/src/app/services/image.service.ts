import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom, Observable } from 'rxjs';

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
    const url = `${this.baseUrl}/${cleanPath}`;
    console.log(`🖼️ URL générée par getImageUrl: ${url}`);
    return url;
  }

  async downloadImage(
    imagePath: string,
    customFilename: string
  ): Promise<void> {
    try {
      // 🔥 Extraction et nettoyage du chemin de l'image
      let cleanPath = imagePath;

      // Si l'URL contient `http://` ou `https://`, extraire uniquement le nom du fichier
      if (imagePath.includes('http://') || imagePath.includes('https://')) {
        cleanPath = new URL(imagePath).pathname; // Extrait "/uploads/nom_fichier.ext"
      }

      // Supprime "/uploads/" ou tout préfixe supplémentaire
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

      // 🔥 Construction de l’URL API backend correcte
      const url = `${this.baseUrl}/${cleanPath}`;
      // console.log('📥 Téléchargement de l’image depuis:', url);

      // 🔥 Téléchargement de l’image
      const blob = await lastValueFrom(
        this.http.get(url, { responseType: 'blob' })
      );

      // 🔥 Génération du nom de fichier propre
      const extension = cleanPath.split('.').pop() || 'jpg'; // Par défaut en "jpg" si pas d'extension trouvée
      const timestamp = Date.now();

      // Nettoie `customFilename` pour éviter les caractères spéciaux dans le nom de fichier
      const safeFilename = customFilename.replace(/[^a-zA-Z0-9_-]/g, '_');

      const filename = `${safeFilename}_${timestamp}.${extension}`;

      // 🔥 Création du lien de téléchargement
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(objectUrl);

      console.log(`✅ Image téléchargée sous : ${filename}`);
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement de l’image:', error);
    }
  }

  deleteImage(imagePath: string): Observable<{ message: string }> {
    const cleanPath = imagePath.replace(/^\/?uploads\/?/, '');
    const url = `${this.baseUrl}/${cleanPath}`;
    console.log('image.service :', url);
    return this.http.delete<{ message: string }>(url);
  }
}
