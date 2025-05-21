import { TestBed } from '@angular/core/testing';
import { ImageService } from './image.service';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

describe('ImageService', () => {
  let service: ImageService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ImageService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ImageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait être créé', () => {
    console.log('ImageService créé');
    expect(service).toBeTruthy();
  });

  it('devrait uploader des images', () => {
    console.log('Test d\'upload d\'images');
    const mockFile = new File(['image'], 'image.jpg', { type: 'image/jpeg' });
    const mockResponse = {
      message: 'Images uploaded successfully',
      imagePath: ['uploads/image.jpg'],
    };

    service.uploadImages([mockFile]).subscribe((response) => {
      console.log('Réponse de l\'upload:', response);
      expect(response.message).toBe('Images uploaded successfully');
      expect(response.imagePath.length).toBe(1);
      console.log('Chemin de l\'image:', response.imagePath[0]);
    });

    console.log('Vérification de la requête HTTP');

    const req = httpMock.expectOne('http://localhost:5000/api/images');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    console.log('Vérification de la requête terminée');
    console.log('FormData:', req.request.body);
    req.flush(mockResponse);
  });

  it('devrait générer une URL d\'image complète', () => {
    console.log('Test de génération d\'URL d\'image');
    const path = 'uploads/test.jpg';
    const fullUrl = service.getImageUrl(path);
    expect(fullUrl).toBe('http://localhost:5000/api/images/test.jpg');
    console.log('URL générée:', fullUrl);
  });

  it('devrait gérer les URL déjà complètes', () => {
    console.log('Test de gestion des URL déjà complètes');
    const fullUrl = 'http://localhost:5000/api/images/image.jpg';
    const result = service.getImageUrl(fullUrl);
    expect(result).toBe(fullUrl);
    console.log('URL déjà complète:', result);
  });

  it('devrait retourner une chaîne vide si le chemin est vide', () => {
    console.log('Test de gestion des chemins vides');
    const result = service.getImageUrl('');
    expect(result).toBe('');
    console.log('Chemin vide géré:', result);
  });

  it('devrait supprimer une image', () => {
    console.log('Test de suppression d\'image');
    const imagePath = '/uploads/image.jpg';

    service.deleteImage(imagePath).subscribe((res) => {
      console.log('Réponse de la suppression:', res);
      expect(res.message).toBe('Image supprimée');
    });

    const req = httpMock.expectOne('http://localhost:5000/api/images/image.jpg');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Image supprimée' });
    console.log('Vérification de la requête de suppression terminée');
  });

  it('devrait renvoyer une erreur si le chemin est vide pour la suppression', (done) => {
    console.log('Test de gestion des erreurs de suppression avec chemin vide');
    service.deleteImage('').subscribe({
      next: () => fail('La suppression aurait dû échouer.'),
      error: (error) => {
        expect(error.message).toBe("Chemin d'image vide.");
        console.log('Erreur gérée:', error);
        done();
      },
    });
  });
});
