import { TestBed } from '@angular/core/testing';
import { DialogService } from './dialog.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { InfoDialogComponent } from '../components/dialog/info-dialog/info-dialog.component';
import { ConfirmDialogComponent } from '../components/dialog/confirm-dialog/confirm-dialog.component';

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

  function setupDialogReturn(): void {
    dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as MatDialogRef<any, any>);
  }

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it('devrait ouvrir une InfoDialog avec info()', () => {
    setupDialogReturn();
    service.info('Message info', 'Titre info').subscribe();

    expect(dialogSpy.open).toHaveBeenCalledWith(InfoDialogComponent, {
      width: '400px',
      data: { message: 'Message info', title: 'Titre info' }
    });
  });

  it('devrait ouvrir une InfoDialog avec success()', () => {
    setupDialogReturn();
    service.success('Succès !');

    expect(dialogSpy.open).toHaveBeenCalledWith(InfoDialogComponent, {
      width: '400px',
      data: { message: 'Succès !', title: 'Succès' }
    });
  });

  it('devrait ouvrir une InfoDialog avec error()', () => {
    setupDialogReturn();
    service.error('Erreur !');

    expect(dialogSpy.open).toHaveBeenCalledWith(InfoDialogComponent, {
      width: '400px',
      data: { message: 'Erreur !', title: 'Erreur' }
    });
  });

  it('devrait afficher une erreur 400 multiple via showHttpError()', () => {
    setupDialogReturn();
    const error = new HttpErrorResponse({
      status: 400,
      error: { errors: [{ msg: 'Erreur A' }, { msg: 'Erreur B' }] }
    });

    service.showHttpError(error);

    expect(dialogSpy.open).toHaveBeenCalledWith(InfoDialogComponent, {
      width: '400px',
      data: { message: 'Erreur A<br>Erreur B', title: 'Erreur' }
    });
  });

  it('devrait afficher une erreur 400 simple via showHttpError()', () => {
    setupDialogReturn();
    const error = new HttpErrorResponse({
      status: 400,
      error: { msg: 'Erreur simple' }
    });

    service.showHttpError(error);

    expect(dialogSpy.open).toHaveBeenCalledWith(InfoDialogComponent, {
      width: '400px',
      data: { message: 'Erreur simple', title: 'Erreur' }
    });
  });

  it('devrait afficher une erreur 404 via showHttpError()', () => {
    setupDialogReturn();
    const error = new HttpErrorResponse({
      status: 404,
      error: {}
    });

    service.showHttpError(error);

    expect(dialogSpy.open).toHaveBeenCalledWith(InfoDialogComponent, {
      width: '400px',
      data: { message: 'Ressource introuvable.', title: 'Erreur' }
    });
  });

  it('devrait afficher une erreur 500 via showHttpError()', () => {
    setupDialogReturn();
    const error = new HttpErrorResponse({
      status: 500,
      error: {}
    });

    service.showHttpError(error);

    expect(dialogSpy.open).toHaveBeenCalledWith(InfoDialogComponent, {
      width: '400px',
      data: { message: 'Erreur serveur. Veuillez réessayer plus tard.', title: 'Erreur' }
    });
  });

  it('devrait afficher une erreur inconnue via showHttpError()', () => {
    setupDialogReturn();
    const error = new HttpErrorResponse({
      status: 0,
      error: {}
    });

    service.showHttpError(error);

    expect(dialogSpy.open).toHaveBeenCalledWith(InfoDialogComponent, {
      width: '400px',
      data: { message: 'Une erreur inconnue est survenue.', title: 'Erreur' }
    });
  });

  it('devrait ouvrir une ConfirmDialog avec confirm()', () => {
    dialogSpy.open.and.returnValue({ afterClosed: () => of('confirm') } as MatDialogRef<any, any>);

    service.confirm('Êtes-vous sûr ?', {
      title: 'Confirmer',
      confirmText: 'Oui',
      cancelText: 'Non',
      extraText: 'Plus tard'
    }).subscribe(result => {
      expect(result).toBe('confirm');
    });

    expect(dialogSpy.open).toHaveBeenCalledWith(ConfirmDialogComponent, {
      width: '500px',
      data: {
        message: 'Êtes-vous sûr ?',
        confirmButtonText: 'Oui',
        cancelButtonText: 'Non',
        extraButton: 'Plus tard'
      },
      panelClass: 'confirm-dialog-panel'
    });
  });
});
