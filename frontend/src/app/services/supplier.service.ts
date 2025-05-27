import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { SharedDataService } from './shared-data.service';
import { DEFAULT_SUPPLIER, Supplier } from '../models/supplier';
import { InfoDialogComponent } from '../components/dialog/info-dialog/info-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private apiUrl = 'http://localhost:5000/api/suppliers';

  private suppliersSubject = new BehaviorSubject<any[]>([]);
  suppliers$ = this.suppliersSubject.asObservable();

  constructor(
    private http: HttpClient,
    private sharedDataService: SharedDataService,
    private dialog: MatDialog
  ) {
    this.loadSuppliers();

    this.sharedDataService.supplierListUpdate$.subscribe(() => {
      this.loadSuppliers();
    });

    this.sharedDataService.ingredientListUpdate$.subscribe(() => {
      this.loadSuppliers();
    });
  }

  private loadSuppliers(): void {
    this.http
      .get<Supplier[]>(this.apiUrl)
      .pipe(
        tap((suppliers) => {
          if (!suppliers || suppliers.length === 0) {
            console.warn(
              "⚠️ Aucun fournisseur trouvé, ajout de 'Sans fournisseur'"
            );
            suppliers = [DEFAULT_SUPPLIER];
          } else {
            suppliers = suppliers.sort((a, b) =>
              a._id === DEFAULT_SUPPLIER._id
                ? -1
                : b._id === DEFAULT_SUPPLIER._id
                ? 1
                : 0
            );
          }
          this.suppliersSubject.next(suppliers);
        }),
        catchError((error) => {
          console.error(
            '❌ Erreur lors de la récupération des fournisseurs :',
            error
          );
          this.suppliersSubject.next([DEFAULT_SUPPLIER]);
          return throwError(
            () => new Error('Erreur lors de la récupération des fournisseurs')
            );
        })
      )
    .subscribe();
  }

  getSuppliers(): Observable<Supplier[]> {
    return this.suppliers$;
  }

  getSupplierById(id: string): Observable<Supplier> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Supplier>(url);
  }

  createSupplier(payload: any): Observable<Supplier> {
    return this.http.post<Supplier>(this.apiUrl, payload).pipe(
      tap(() => {
        this.sharedDataService.notifySupplierUpdate();
      }),
      catchError(this.handleError.bind(this))
    );
  }

  updateSupplier(id: string, payload: any): Observable<Supplier> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Supplier>(url, payload).pipe(
      tap(() => {
        this.sharedDataService.notifySupplierUpdate();
      }),
      catchError(this.handleError.bind(this))
    );
  }

  deleteSupplier(id: string): Observable<{ message: string }> {
    const url = `${this.apiUrl}/${id}`;
    console.log('Suppression du fournisseur avec l\'ID :', id);
    console.log('URL de la requête :', url);
    return this.http.delete<{ message: string }>(url).pipe(
      tap(() => {
        this.sharedDataService.notifySupplierUpdate();
      }),
      catchError(this.handleError.bind(this)) 
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue.';

    if (error.status === 400) {
      errorMessage = error.error.msg || 'Requête invalide.';
    } else if (error.status === 404) {
      errorMessage = error.error.msg || 'Erreur 404 : Ressource introuvable.';
    } else if (error.status === 500) {
      errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
    }

    this.dialog.open(InfoDialogComponent, {
      width: '400px',
      data: { message: errorMessage, type: 'error' },
    });

    return throwError(() => new Error(errorMessage));
  }
}

export { Supplier };