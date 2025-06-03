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

  it('devrait ouvrir une InfoDialog avec info()', () => {
    service.info('Message info', 'Titre info');

    expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), {
      width: '400px',
      data: { message: 'Message info', title: 'Titre info' }
    });
  });

  it('devrait ouvrir une InfoDialog avec success()', () => {
    service.success('Succès !');

    expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), {
      width: '400px',
      data: { message: 'Succès !', title: 'Succès' }
    });
  });

  it('devrait ouvrir une InfoDialog avec error()', () => {
    service.error('Erreur !');

    expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), {
      width: '400px',
      data: { message: 'Erreur !', title: 'Erreur' }
    });
  });

  it('devrait afficher une erreur 400 multiple via showHttpError()', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { errors: [{ msg: 'Erreur A' }, { msg: 'Erreur B' }] }
    });

    service.showHttpError(error);

    expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), {
      width: '400px',
      data: { message: 'Erreur A<br>Erreur B', title: 'Erreur' }
    });
  });

  it('devrait afficher une erreur 400 simple via showHttpError()', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { msg: 'Erreur simple' }
    });

    service.showHttpError(error);

    expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), {
      width: '400px',
      data: { message: 'Erreur simple', title: 'Erreur' }
    });
  });

  it('devrait afficher une erreur 404 via showHttpError()', () => {
    const error = new HttpErrorResponse({
      status: 404,
      error: {}
    });

    service.showHttpError(error);

    expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), {
      width: '400px',
      data: { message: 'Ressource introuvable.', title: 'Erreur' }
    });
  });

  it('devrait afficher une erreur 500 via showHttpError()', () => {
    const error = new HttpErrorResponse({
      status: 500,
      error: {}
    });

    service.showHttpError(error);

    expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), {
      width: '400px',
      data: { message: 'Erreur serveur. Veuillez réessayer plus tard.', title: 'Erreur' }
    });
  });

  it('devrait afficher une erreur inconnue via showHttpError()', () => {
    const error = new HttpErrorResponse({
      status: 0,
      error: {}
    });

    service.showHttpError(error);

    expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), {
      width: '400px',
      data: { message: 'Une erreur inconnue est survenue.', title: 'Erreur' }
    });
  });
});
