import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ImageService } from './image.service';

// ------------------------------------------------------------------
//  Spécifications du ImageService (Angular 19 providers)
// ------------------------------------------------------------------
//  – Utilise provideHttpClient / provideHttpClientTesting
//  – Teste : upload, getImageUrl (3 cas), delete (OK & KO)
// ------------------------------------------------------------------

describe('ImageService', () => {
  let service: ImageService;
  let httpMock: HttpTestingController;

  const apiUrl = 'http://localhost:5000/api/images';

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

  // ---------------------------------------------------------------
  //  Construction
  // ---------------------------------------------------------------
  it('doit être créé', () => {
    expect(service).toBeTruthy();
  });

  // ---------------------------------------------------------------
  //  uploadImages
  // ---------------------------------------------------------------
  it('doit uploader des images (FormData)', () => {
    const mockFile = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    const mockResponse = {
      message: 'ok',
      imagePath: ['uploads/photo.jpg'],
    };

    service.uploadImages([mockFile]).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    expect((req.request.body as FormData).has('images')).toBeTrue();

    req.flush(mockResponse);
  });

  // ---------------------------------------------------------------
  //  getImageUrl
  // ---------------------------------------------------------------
  it("doit générer l'URL complète pour un chemin relatif", () => {
    const path = 'uploads/test.jpg';
    expect(service.getImageUrl(path)).toBe(`${apiUrl}/test.jpg`);
  });

  it('doit renvoyer la même URL si already full', () => {
    const full = `${apiUrl}/photo.jpg`;
    expect(service.getImageUrl(full)).toBe(full);
  });

  it('doit renvoyer une chaîne vide si chemin vide', () => {
    expect(service.getImageUrl('')).toBe('');
  });

  // ---------------------------------------------------------------
  //  deleteImage
  // ---------------------------------------------------------------
  it('doit supprimer une image et retourner le message', () => {
    const imagePath = '/uploads/photo.jpg';

    service.deleteImage(imagePath).subscribe((res) => {
      expect(res.message).toBe('deleted');
    });

    const req = httpMock.expectOne(`${apiUrl}/photo.jpg`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'deleted' });
  });

  it('doit retourner une erreur si chemin vide', (done) => {
    service.deleteImage('').subscribe({
      next: () => fail('Devait échouer'),
      error: (err) => {
        expect(err.message).toBe("Chemin d'image vide.");
        done();
      },
    });
  });
});
