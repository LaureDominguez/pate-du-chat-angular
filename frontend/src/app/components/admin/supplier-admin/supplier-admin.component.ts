import { Component, ElementRef, HostListener, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { AdminModule } from '../admin.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { DEFAULT_SUPPLIER, Supplier } from '../../../models/supplier';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { catchError, of, Subject, takeUntil, tap } from 'rxjs';
import { SharedDataService } from '../../../services/shared-data.service';
import { SupplierService } from '../../../services/supplier.service';
import { ConfirmDialogComponent } from '../../dialog/confirm-dialog/confirm-dialog.component';

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
  // isEditing = false;

  isDefaultSupplier(supplier: Supplier): boolean {
    return supplier._id === DEFAULT_SUPPLIER._id;
  }

  private unsubscribe$ = new Subject<void>(); // Permet de gérer les souscriptions

  @ViewChild('suppliersPaginator') suppliersPaginator!: MatPaginator;
  @ViewChild('suppliersSort') suppliersSort!: MatSort;

  @ViewChild('supplierNameInput') supplierNameInput!: ElementRef;
  @ViewChild('supplierDescriptionInput') supplierDescriptionInput!: ElementRef;

  constructor(
    private supplierService: SupplierService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private sharedDataService: SharedDataService
  ) {}

  ngOnInit(): void {
    this.supplierService.getSuppliers()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((suppliers) => {
        if (!suppliers.some((sup) => sup._id === DEFAULT_SUPPLIER._id)) {
          suppliers.unshift(DEFAULT_SUPPLIER);
        }
        this.suppliers.data = suppliers;
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
  }

  startEditingSupplier(supplier: Supplier | null = null, focusField?: 'name' | 'description'): void {
    if (this.editingSupplier && this.editingSupplier._id !== supplier?._id) {
      return;
    }

    if (supplier && this.isDefaultSupplier(supplier)) {
      return;
    }

    const autoFocusField: 'name' | 'description' | undefined = !supplier && !focusField ? 'name' : focusField;

    this.editingSupplier = supplier ? { ...supplier } : { _id: null, name: '', description: ''};

    this.supplierForm = this.fb.group({
      name: [
        this.editingSupplier.name,
        [
          Validators.required, 
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z0-9À-ÿŒœ\s-']+$/),
        ]
      ],
      description: [
        this.editingSupplier.description,
        [
          Validators.maxLength(100),
          Validators.pattern(/^[a-zA-Z0-9À-ÿŒœ\s.,!?()'"-]+$/),
        ]
      ]
    });

    if (!this.editingSupplier._id) {
      this.suppliers.data = [this.editingSupplier, ...this.suppliers.data];
    }
    this.focusSupplierInput(autoFocusField);
  }

  
  focusSupplierInput(focusField?: 'name' | 'description'): void {
    // console.log('focusSupplierInput -> this.supplierNameInput', this.supplierNameInput);

    setTimeout(() => {
      if (focusField === 'name' && this.supplierNameInput) {
        this.supplierNameInput.nativeElement.focus();
      } else if (focusField === 'description' && this.supplierDescriptionInput) {
        this.supplierDescriptionInput.nativeElement.focus();
      }
      // const input = document.querySelector<HTMLInputElement>('[formControlName="name"]');
      // console.log('focusSupplierInput -> input', input);
      // if (input) {
      //   input.focus();
      // }
    });
  }

  cancelEditingSupplier(event?: FocusEvent): void {
    const relatedTarget = event?.relatedTarget as HTMLElement;

    // console.log('cancelEditingSupplier -> relatedTarget', relatedTarget);

    if (relatedTarget && relatedTarget.closest('.editing-mode')) {
      return;
    }

    setTimeout(() => {
      this.editingSupplier = null;
      this.suppliers.data = this.suppliers.data.filter(sup => sup._id !== null);
    }, 0);
    // this.editingSupplier = null;
    // this.suppliers.data = this.suppliers.data.filter(sup => sup._id !== null);
  }

  formatNameInput(name: string): string {
    if (!name) return "";
    return name.trim().charAt(0).toUpperCase() + name.trim().slice(1);
  }

  saveSupplier(supplier: Supplier): void {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }

    console.log('save -> supplier', supplier);

    const newSupplier: Supplier = {
      name: this.formatNameInput(this.supplierForm.get('name')?.value),
      description: this.formatNameInput(this.supplierForm.get('description')?.value),
    };

    console.log('save -> newSupplier', newSupplier);

    const request$ = supplier._id
      ? this.supplierService.updateSupplier(supplier._id, newSupplier)
      : this.supplierService.createSupplier(newSupplier);

    request$.pipe(
      tap(() => this.cancelEditingSupplier()),
      catchError(() => {
        this.cancelEditingSupplier();
        return of(null);
      })
    )
    .subscribe();
  }

  private createNewSupplier(data: {name: string; description?: string}): void {
    const newSupplier: Supplier = {
      _id: null,
      name: this.formatNameInput(data.name),
      description: data.description || '',
    };

    console.log('createNewSupplier -> newSupplier', newSupplier);

    this.supplierService
      .createSupplier(newSupplier)
      .subscribe((createdSupplier) => {
        this.sharedDataService.sendSupplierToIngredientForm(createdSupplier);
      });
  }

  deleteSupplier(supplier: Supplier): void {
    if (this.isDefaultSupplier(supplier)) {
      return; // Ne pas supprimer le fournisseur par défaut
    }

    if (supplier.ingredientCount && supplier.ingredientCount > 0) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          message: `Ce fournisseur est associé à <span class="bold-text">${supplier.ingredientCount}</span> ingrédients.
          <br> Êtes-vous sûr de vouloir supprimer le fournisseur : <br> 
          <span class="bold-text">"${supplier.name}"</span>?`,
        },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'confirm') {
          console.log('pouet supprimé : ', result);
          this.supplierService
          .deleteSupplier(supplier._id!)
          .subscribe(() => {});
        }
      });
    } else {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          message: `Êtes-vous sûr de vouloir supprimer ce fournisseur : <br>
          <span class="bold-text">"${supplier.name}"</span>?`,
        },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'confirm') {
          this.supplierService
          .deleteSupplier(supplier._id!)
          .subscribe(() => {});
        }
      });
    }
  }

}


