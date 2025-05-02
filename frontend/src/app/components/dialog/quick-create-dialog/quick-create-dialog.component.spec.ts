import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuickCreateDialogComponent } from './quick-create-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('QuickCreateDialogComponent', () => {
  let component: QuickCreateDialogComponent;
  let fixture: ComponentFixture<QuickCreateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickCreateDialogComponent],
      declarations: [QuickCreateDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickCreateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
