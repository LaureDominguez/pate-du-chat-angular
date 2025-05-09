import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-info-dialog',
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  templateUrl: './info-dialog.component.html',
  styleUrls: ['./info-dialog.component.scss'],
})
export class InfoDialogComponent {
  ngOnInit() {
    throw new Error('Method not implemented.');
  }
  title: string = '';
  constructor(
    public dialogRef: MatDialogRef<InfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      message: string;
      type: 'error' | 'info' | 'success';
    }
  ) {
    switch (data.type) {
      case 'error':
        this.title = 'Erreur';
        break;
      case 'info':
        this.title = 'Information';
        break;
      case 'success':
        this.title = 'Succès';
        break;
    }
  }

}
