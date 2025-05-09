import { TestBed } from '@angular/core/testing';
import { ImageService } from './image.service';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient, withJsonpSupport, withInterceptors } from '@angular/common/http';

describe('ImageService', () => {
  let service: ImageService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withJsonpSupport(), // Support JSONP si besoin
          withInterceptors([]) // Pas d'intercepteurs dans ce test
        ),
        provideHttpClientTesting(),
        ImageService
      ]
    });

    service = TestBed.inject(ImageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it('devrait uploader des images', () => {
    const mockResponse = { message: 'Images uploadées', imagePath: ['/uploads/image1.jpg'] };
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    service.uploadImages([mockFile]).subscribe((response) => {
      expect(response.message).toBe('Images uploadées');
      expect(response.imagePath.length).toBe(1);
      expect(response.imagePath[0]).toBe('/uploads/image1.jpg');
    });

    const req = httpMock.expectOne('http://localhost:5000/api/images');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('devrait retourner l\'URL complète d\'une image', () => {
    const url = service.getImageUrl('/uploads/image1.jpg');
    expect(url).toBe('http://localhost:5000/api/images/image1.jpg');
  });

  it('devrait supprimer une image', () => {
    const mockResponse = { message: 'Image supprimée' };

    service.deleteImage('/uploads/image1.jpg').subscribe((response) => {
      expect(response.message).toBe('Image supprimée');
    });

    const req = httpMock.expectOne('http://localhost:5000/api/images/image1.jpg');
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });

  it('devrait télécharger une image avec un nom de fichier personnalisé', async () => {
    const mockBlob = new Blob(['image content'], { type: 'image/jpeg' });
    const mockUrl = 'http://localhost:5000/api/images/image1.jpg';

    const spyCreateElement = spyOn(document, 'createElement').and.callFake(() => {
      return {
        href: '',
        download: '',
        click: jasmine.createSpy('click'),
        remove: jasmine.createSpy('remove')
      } as any;
    });

    spyOn(URL, 'createObjectURL').and.returnValue('blob:http://localhost/image');
    spyOn(URL, 'revokeObjectURL');

    await service.downloadImage('/uploads/image1.jpg', 'custom_filename');

    const req = httpMock.expectOne(mockUrl);
    req.flush(mockBlob);

    expect(spyCreateElement).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});
