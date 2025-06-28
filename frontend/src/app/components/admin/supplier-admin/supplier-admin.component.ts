import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AdminModule } from '../admin.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { DEFAULT_SUPPLIER, Supplier } from '../../../models/supplier';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { catchError, firstValueFrom, of, Subject, takeUntil, tap } from 'rxjs';
import { SharedDataService } from '../../../services/shared-data.service';
import { SupplierService } from '../../../services/supplier.service';
import { DialogService } from '../../../services/dialog.service';
import { IngredientService } from '../../../services/ingredient.service';

@Component({
  selector: 'app-supplier-admin',
  imports: [AdminModule],
  templateUrl: './supplier-admin.component.html',
  styleUrls: ['./supplier-admin.component.scss', '../admin.component.scss']
})
export class SupplierAdminComponent implements OnInit, OnDestroy {
  suppliers = new MatTableDataSource<Supplier>([]);
  displayedSuppliersColumns: string[] = ['name', 'description', 'ingredientCount', 'actions'];
  supplierForm!: FormGroup;
  newSupplier: Supplier | null = null;
  editingSupplierId: string | null = null;
  editingSupplier: Supplier | null = null;
  
  highlightedSupplierId: string | null = null;

  isDefaultSupplier(supplier: Supplier): boolean {
    return supplier._id === DEFAULT_SUPPLIER._id;
  }

  private unsubscribe$ = new Subject<void>();

  @ViewChild('suppliersPaginator') suppliersPaginator!: MatPaginator;
  @ViewChild('suppliersSort') suppliersSort!: MatSort;

  @ViewChild('supplierNameInput') supplierNameInput!: ElementRef;
  @ViewChild('supplierDescriptionInput') supplierDescriptionInput!: ElementRef;

  @Output() countChanged = new EventEmitter<number>();


  constructor(
    private supplierService: SupplierService,
    private ingredientService: IngredientService,
    private fb: FormBuilder,
    private sharedDataService: SharedDataService,
    private dialogService: DialogService
  ) { }

  ngOnInit(): void {
    this.supplierService.suppliers$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((suppliers) => {
        if (!suppliers.some((sup) => sup._id === DEFAULT_SUPPLIER._id)) {
          suppliers.unshift(DEFAULT_SUPPLIER);
        }
        this.suppliers.data = suppliers;
        this.countChanged.emit(suppliers.length);
      });

    this.sharedDataService.requestNewSupplier$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data) => {
        this.createNewSupplier(data);
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngAfterViewInit(): void {
    this.suppliers.paginator = this.suppliersPaginator;
    this.suppliers.sort = this.suppliersSort;
    this.suppliers.sortingDataAccessor = (item: Supplier, property: string): string | number => {
      if (item._id && item._id === this.highlightedSupplierId && item._id !== this.editingSupplierId) {
        return '\u0000'; // tri priorité haute
      }
      return (item as any)[property];
    };
  }

  startEditingSupplier(supplier: Supplier | null = null, focusField?: 'name' | 'description'): void {
    if (this.editingSupplier && this.editingSupplier._id === null) {
      return;
    }
    if (this.editingSupplier && this.editingSupplier._id !== supplier?._id) {
      return;
    }
    if (supplier && this.isDefaultSupplier(supplier)) {
      return;
    }

    const autoFocusField: 'name' | 'description' | undefined = !supplier && !focusField ? 'name' : focusField;

    this.editingSupplier = supplier ? { ...supplier } : { _id: null, name: '', description: '' };

    this.supplierForm = this.fb.group({
      name: [
        this.editingSupplier.name,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/\S+/),
          Validators.pattern(/^[a-zA-ZÀ-ÿŒœ0-9\s.,'"’()\-@%°&+]*$/)
        ]
      ],
      description: [
        this.editingSupplier.description,
        [
          Validators.maxLength(100),
          Validators.pattern(/\S+/),
          Validators.pattern(/^[a-zA-ZÀ-ÿŒœ0-9\s.,'"’()\-@%°&+]*$/)
        ]
      ]
    });

    if (!this.editingSupplier._id) {
      this.suppliers.data = [this.editingSupplier, ...this.suppliers.data];
    }
    this.focusSupplierInput(autoFocusField);
  }


  focusSupplierInput(focusField?: 'name' | 'description'): void {
    setTimeout(() => {
      if (focusField === 'name' && this.supplierNameInput) {
        this.supplierNameInput.nativeElement.focus();
      } else if (focusField === 'description' && this.supplierDescriptionInput) {
        this.supplierDescriptionInput.nativeElement.focus();
      }
    });
  }

  cancelEditingSupplier(event?: FocusEvent): void {
    const relatedTarget = event?.relatedTarget as HTMLElement;

    if (relatedTarget && relatedTarget.closest('.editing-mode')) {
      return;
    }

    setTimeout(() => {
      this.editingSupplier = null;
      this.suppliers.data = this.suppliers.data.filter(sup => sup._id !== null);
    }, 0);
  }

  formatNameInput(name: string): string {
    if (!name) return "";
    return name.trim().charAt(0).toUpperCase() + name.trim().slice(1);
  }


  // Save ou create new supplier depuis tableau editable
  saveSupplier(supplier: Supplier): void {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }

    const newSupplier: Supplier = {
      name: this.formatNameInput(this.supplierForm.get('name')?.value),
      description: this.formatNameInput(this.supplierForm.get('description')?.value),
    };

    const isUpdate = !!supplier._id;
    const request$ = supplier._id
      ? this.supplierService.updateSupplier(supplier._id!, newSupplier)
      : this.supplierService.createSupplier(newSupplier);

    request$.pipe(
      tap((savedSupplier) => {
        this.dialogService.info(
          supplier._id ? 'Fournisseur modifié avec succès.' : 'Fournisseur créé avec succès.'
        );
        this.cancelEditingSupplier();
        this.highlightedSupplierId = isUpdate ? null : savedSupplier._id || null;
        this.editingSupplier = null;
        this.editingSupplierId = null;

        this.suppliers.sort!.active = 'name';
        this.suppliers.sort!.direction = 'asc';
        this.suppliers.sort!.sortChange.emit();
      }),
      catchError((error) => {
        this.cancelEditingSupplier();
        this.dialogService.showHttpError(error);
        return of(null);
      })
    ).subscribe();
    // this.sharedDataService.notifySupplierUpdate();
  }

  // create new supplier depuis ingredient-form
  private createNewSupplier(data: { name: string; description?: string }): void {
    const newSupplier: Supplier = {
      _id: null,
      name: this.formatNameInput(data.name),
      description: data.description || '',
    };

    this.supplierService
      .createSupplier(newSupplier)
      .subscribe({
        next: (createdSupplier) => {
          this.dialogService.info('Fournisseur créé avec succès.');
          this.sharedDataService.sendSupplierToIngredientForm(createdSupplier);
        this.highlightedSupplierId = createdSupplier._id || null;

        this.suppliers.sort!.active = 'name';
        this.suppliers.sort!.direction = 'asc';
        this.suppliers.sort!.sortChange.emit();
        },
        error: (err) => {
          this.dialogService.showHttpError(err);
        }
      });
  }
    
  deleteSupplier(supplier: Supplier): void {
    this.checkIngredientsInSupplier(supplier)
  }
  private async checkIngredientsInSupplier(
    supplier: Supplier,
    canRetry: boolean = true
  ): Promise<void> {
    if (this.isDefaultSupplier(supplier)) {
      this.dialogService.info(
        'Vous ne pouvez pas supprimer le fournisseur "Sans fournisseur".'
      );
      return;
    }

    const ingredientCount = supplier.ingredientCount || 0;
    const message = ingredientCount > 0
      ? `Ce fournisseur est associé à <b>${ingredientCount}</b> ingrédient(s).<br>
          Êtes-vous sûr de vouloir supprimer le fournisseur : <br>
          <b>"${supplier.name}"</b> ?`
      : `Êtes-vous sûr de vouloir supprimer le fournisseur : <br>
          <b>"${supplier.name}"</b> ?`;
    
    const result = await firstValueFrom(
      this.dialogService.confirm(message, {
        title: 'Suppression de fournisseur',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        extraText: ingredientCount > 0 ? 'Voir les ingrédients' : undefined,
      })
    );
    // .subscribe(result => {
    if (result === 'cancel') return;
    if (result === 'extra' && canRetry) {
      await this.showRelatedIngredients(supplier);
      return this.checkIngredientsInSupplier(supplier, false); 
    }

      this.supplierService.deleteSupplier(supplier._id!).subscribe({
        next: () => {
          this.dialogService.info('Fournisseur supprimé avec succès.');
          // this.sharedDataService.notifySupplierUpdate(); // Optionnel si reload
        },
        error: (err) => {
          this.dialogService.showHttpError(err);
        }
      });
    // })
  }

  private async showRelatedIngredients(supplier: Supplier): Promise<void> {
    try {
      const ingredients = await firstValueFrom(
        this.ingredientService.getIngredientsBySupplier(supplier._id!)
      );
      if (!ingredients.length) {
        await firstValueFrom(
          this.dialogService.info('Aucun ingrédient associé à ce fournisseur.', 'Ingrédients associés')
        );
        return;
      }
      const ingredientList = ingredients.map(ing => `<li>${ing.name}</li>`).join('');
      await firstValueFrom(
        this.dialogService.info(
          `Ingrédients associés au fournisseur <b>"${supplier.name}"</b>:<br>${ingredientList}`,
          'Ingrédients associés')
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des ingrédients associés:', error);
      this.dialogService.error('Impossible de charger les ingrédients associés à ce fournisseur.');
    }
  }
  

}


