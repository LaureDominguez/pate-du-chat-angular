import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfoDialogComponent } from './info-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('InfoDialogComponent', () => {
  let component: InfoDialogComponent;
  let fixture: ComponentFixture<InfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            message: 'Test message',
            title: 'Test Title'
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait afficher le message fourni dans les données', () => {
    expect(component.data.message).toBe('Test message');
  });

  it('devrait afficher le titre fourni dans les données', () => {
    expect(component.data.title).toBe('Test Title');
  });
});
