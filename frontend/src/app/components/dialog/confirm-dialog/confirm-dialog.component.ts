import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      message: string;
      confirmButtonText?: string;
      cancelButtonText?: string;
      extraButton?: string;
    }
  ) {}

  onConfirm(): void {
    this.dialogRef.close('confirm');
  }

  onExtra(): void {
    this.dialogRef.close('extra');
  }

  onCancel(): void {
    this.dialogRef.close('cancel');
  }
}
