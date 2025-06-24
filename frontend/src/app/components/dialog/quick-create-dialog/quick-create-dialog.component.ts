import { Component, Inject } from '@angular/core';
import { AdminModule } from '../../admin/admin.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

interface QuickCreateDialogData {
  title: string;
  fields: {
    name: string;
    label: string;
    required?: boolean;
    maxLength?: number;
    pattern?: RegExp;
    defaultValue?: string;
  }[];
}

@Component({
  selector: 'app-quick-create-dialog',
  standalone: true,
  imports: [AdminModule],
  templateUrl: './quick-create-dialog.component.html',
  styleUrls: ['./quick-create-dialog.component.scss']
})
export class QuickCreateDialogComponent {
  form : FormGroup = new FormGroup({});

  constructor(
    private dialogRef: MatDialogRef<QuickCreateDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: QuickCreateDialogData,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({});
    this.data.fields.forEach(field => {
      const validators = [];
      if (field.required) validators.push(Validators.required);
      if (field.maxLength) validators.push(Validators.maxLength(field.maxLength));
      if (field.pattern) validators.push(Validators.pattern(field.pattern));
      this.form.addControl(
        field.name, 
        this.fb.control(field.defaultValue || '', validators)
      );
    });

    console.log('Form initialized with fields:', this.data.fields);
  } 
  
  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
