import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, ReplaySubject, Subject, timer } from 'rxjs';
import { InfoDialogComponent } from '../components/dialog/info-dialog/info-dialog.component';
import { ConfirmDialogComponent } from '../components/dialog/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })

export class DialogService {
  private dialogRefs: MatDialogRef<any>[] = [];
  private dialogsClosedSubject = new ReplaySubject<void>(1);
  
  afterAllDialogsClosed$ = this.dialogsClosedSubject.asObservable();

  constructor(private dialog: MatDialog) {
    console.log('DialogService initialized');
    this.dialogsClosedSubject.next();
    
    this.dialog.afterOpened.subscribe((ref: MatDialogRef<any>) => {
      console.log('Dialog opened', ref.id);
      this.dialogRefs.push(ref);
      
      ref.afterClosed().subscribe(() => {
        console.log('Dialog closed', ref.id);
        // Retirer le dialogue fermé
        this.dialogRefs = this.dialogRefs.filter(r => r !== ref);
        
        // Émettre si plus de dialogues
        if (this.dialogRefs.length === 0) {
          timer(300).subscribe(() => {
            this.dialogsClosedSubject.next();
          });
        }
      });
    });
  }

  // Nouvelle méthode pour déclencher manuellement si nécessaire
  checkDialogsClosed(): void {
    console.log('checkDialogsClosed');
    if (this.dialogRefs.length === 0) {
      this.dialogsClosedSubject.next();
    }
  }

  info(message: string, title = 'Information'): Observable<any> {
    return this.openInfoDialog(message, title);
  }

  success(message: string, title = 'Succès') {
    this.openInfoDialog(message, title);
  }

  error(message: string, title = 'Erreur') {
    this.openInfoDialog(message, title);
  }

confirm(
  message: string,
  options?: {
    title?: string;
    confirmText?: string;
    cancelText?: string;
    extraText?: string;
  }
): Observable<'confirm' | 'cancel' | 'extra'> {
  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    width: '500px',
    data: {
      message,
      confirmButtonText: options?.confirmText || 'Oui',
      cancelButtonText: options?.cancelText || 'Non',
      extraButton: options?.extraText
    },
    panelClass: 'confirm-dialog-panel'
  });

  return dialogRef.afterClosed();
}

  showHttpError(error: HttpErrorResponse) {
    const message = this.extractErrorMessage(error);
    this.error(message);
  }


  private openInfoDialog(message: string, title?: string): Observable<any> {
    const dialogRef = this.dialog.open(InfoDialogComponent, {
      width: '400px',
      data: { message, title }
    });
    return dialogRef.afterClosed();
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400 && error.error?.errors) {
      return error.error.errors.map((e: any) => e.msg).join('<br>');
    }

    return error.error?.msg || 
          (error.status === 404 ? 'Ressource introuvable.' :
            error.status === 500 ? 'Erreur serveur. Veuillez réessayer plus tard.' :
            'Une erreur inconnue est survenue.');
  }
}

