import { TestBed } from '@angular/core/testing';
import { DialogService } from './dialog.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { InfoDialogComponent } from '../components/dialog/info-dialog/info-dialog.component';
import { ConfirmDialogComponent } from '../components/dialog/confirm-dialog/confirm-dialog.component';
import { HttpErrorResponse } from '@angular/common/http';

// ------------------------------------------------------------------
//  Spécifications – DialogService
// ------------------------------------------------------------------
//  Vérifie : info / success / error / confirm + showHttpError pour différents codes
// ------------------------------------------------------------------

describe('DialogService', () => {
  let service: DialogService;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  function mockAfterClosed(returnValue: any = null) {
    dialogSpy.open.and.returnValue({ afterClosed: () => of(returnValue) } as MatDialogRef<any, any>);
  }

  beforeEach(() => {
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      providers: [
        DialogService,
        { provide: MatDialog, useValue: dialogSpy },
      ],
    });

    service = TestBed.inject(DialogService);
  });

  it('doit être créé', () => {
    expect(service).toBeTruthy();
  });

  // ---------------------------------------------------------------
  //  info / success / error
  // ---------------------------------------------------------------
  it('doit ouvrir InfoDialog via info()', (done) => {
    mockAfterClosed();
    service.info('MSG', 'TITRE').subscribe(() => {
      expect(dialogSpy.open).toHaveBeenCalledWith(InfoDialogComponent, {
        width: '400px',
        data: { message: 'MSG', title: 'TITRE' },
      });
      done();
    });
  });

  it('doit ouvrir InfoDialog via success()', () => {
    mockAfterClosed();
    service.success('Bravo');
    expect(dialogSpy.open).toHaveBeenCalledWith(InfoDialogComponent, {
      width: '400px',
      data: { message: 'Bravo', title: 'Succès' },
    });
  });

  it('doit ouvrir InfoDialog via error()', () => {
    mockAfterClosed();
    service.error('Erreur !');
    expect(dialogSpy.open).toHaveBeenCalledWith(InfoDialogComponent, {
      width: '400px',
      data: { message: 'Erreur !', title: 'Erreur' },
    });
  });

  // ---------------------------------------------------------------
  //  showHttpError – déclinaisons
  // ---------------------------------------------------------------
  const cases: [number, any, string][] = [
    [400, { errors: [{ msg: 'A' }, { msg: 'B' }] }, 'A<br>B'],
    [400, { msg: 'simple' }, 'simple'],
    [404, {}, 'Ressource introuvable.'],
    [500, {}, 'Erreur serveur. Veuillez réessayer plus tard.'],
    [0, {}, 'Une erreur inconnue est survenue.'],
  ];

  cases.forEach(([status, errBody, expected]) => {
    it(`doit afficher message correct pour status ${status}`, () => {
      mockAfterClosed();
      const error = new HttpErrorResponse({ status, error: errBody });
      service.showHttpError(error);
      expect(dialogSpy.open).toHaveBeenCalledWith(InfoDialogComponent, {
        width: '400px',
        data: { message: expected, title: 'Erreur' },
      });
    });
  });

  // ---------------------------------------------------------------
  //  confirm
  // ---------------------------------------------------------------
  it('doit ouvrir ConfirmDialog et retourner résultat', (done) => {
    dialogSpy.open.and.returnValue({ afterClosed: () => of('confirm') } as MatDialogRef<any, any>);

    service
      .confirm('OK ?', {
        title: 'Confirmer',
        confirmText: 'Oui',
        cancelText: 'Non',
        extraText: 'Plus tard',
      })
      .subscribe((res) => {
        expect(res).toBe('confirm');
        done();
      });

    expect(dialogSpy.open).toHaveBeenCalledWith(ConfirmDialogComponent, {
      width: '500px',
      data: {
        message: 'OK ?',
        confirmButtonText: 'Oui',
        cancelButtonText: 'Non',
        extraButton: 'Plus tard',
      },
      panelClass: 'confirm-dialog-panel',
    });
  });
});
