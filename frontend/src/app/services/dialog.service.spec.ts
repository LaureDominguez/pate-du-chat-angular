import { TestBed } from '@angular/core/testing';
import { DialogService } from './dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';

describe('DialogService', () => {
  let service: DialogService;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      providers: [
        DialogService,
        { provide: MatDialog, useValue: matDialogSpy }
      ]
    });

    service = TestBed.inject(DialogService);
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  // it('devrait ouvrir une InfoDialog avec showInfo()', () => {
  //   service.showInfo('Test message', 'success');

  //   expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), {
  //     width: '400px',
  //     data: { message: 'Test message', type: 'success' }
  //   });
  // });

  // it('devrait afficher une erreur 400 multiple via showHttpError()', () => {
  //   const error = new HttpErrorResponse({
  //     status: 400,
  //     error: { errors: [{ msg: 'Erreur A' }, { msg: 'Erreur B' }] }
  //   });

  //   service.showHttpError(error);

  //   expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), {
  //     width: '400px',
  //     data: { message: 'Erreur A<br>Erreur B', type: 'error' }
  //   });
  // });

  // it('devrait afficher une erreur 400 simple via showHttpError()', () => {
  //   const error = new HttpErrorResponse({
  //     status: 400,
  //     error: { msg: 'Erreur simple' }
  //   });

  //   service.showHttpError(error);

  //   expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), {
  //     width: '400px',
  //     data: { message: 'Erreur simple', type: 'error' }
  //   });
  // });

  // it('devrait afficher une erreur 404 via showHttpError()', () => {
  //   const error = new HttpErrorResponse({
  //     status: 404,
  //     error: { msg: 'Non trouvé' }
  //   });

  //   service.showHttpError(error);

  //   expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), {
  //     width: '400px',
  //     data: { message: 'Non trouvé', type: 'error' }
  //   });
  // });

  // it('devrait afficher une erreur 500 via showHttpError()', () => {
  //   const error = new HttpErrorResponse({
  //     status: 500,
  //     error: {}
  //   });

  //   service.showHttpError(error);

  //   expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), {
  //     width: '400px',
  //     data: { message: 'Erreur serveur. Veuillez réessayer plus tard.', type: 'error' }
  //   });
  // });

  // it('devrait afficher une erreur inconnue via showHttpError()', () => {
  //   const error = new HttpErrorResponse({
  //     status: 0,
  //     error: {}
  //   });

  //   service.showHttpError(error);

  //   expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), {
  //     width: '400px',
  //     data: { message: 'Une erreur inconnue est survenue.', type: 'error' }
  //   });
  // });
});
