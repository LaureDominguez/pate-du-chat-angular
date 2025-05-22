// dialog.service.ts
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { InfoDialogComponent } from '../components/dialog/info-dialog/info-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  showInfo(message: string, type: 'success' | 'info' | 'error') {
    this.dialog.open(InfoDialogComponent, {
      width: '400px',
      data: { message, type }
    });
  }

  showHttpError(error: HttpErrorResponse) {
    const message = this.extractErrorMessage(error);
    this.showInfo(message, 'error');
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400) {
      if (error.error?.errors) {
        return error.error.errors.map((e: any) => e.msg).join('<br>');
      }
      return error.error?.msg || 'Requête invalide.';
    }

    if (error.status === 404) {
      return error.error?.msg || 'Erreur 404 : Ressource introuvable.';
    }

    if (error.status === 500) {
      return 'Erreur serveur. Veuillez réessayer plus tard.';
    }

    return 'Une erreur inconnue est survenue.';
  }
}
