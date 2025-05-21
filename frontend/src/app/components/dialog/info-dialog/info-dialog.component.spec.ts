import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfoDialogComponent } from './info-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component } from '@angular/core';

describe('InfoDialogComponent', () => {
  let fixture: ComponentFixture<InfoDialogComponent>;

  function createComponentWithType(type: 'info' | 'error' | 'success') {
    TestBed.configureTestingModule({
      imports: [InfoDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            message: 'Test message',
            type,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoDialogComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('devrait être créé', async () => {
    const component = createComponentWithType('info');
    expect(component).toBeTruthy();
  });

  it('devrait afficher le titre "Information" si type est "info"', () => {
    const component = createComponentWithType('info');
    expect(component.title).toBe('Information');
  });

  it('devrait afficher le titre "Erreur" si type est "error"', () => {
    const component = createComponentWithType('error');
    expect(component.title).toBe('Erreur');
  });

  it('devrait afficher le titre "Succès" si type est "success"', () => {
    const component = createComponentWithType('success');
    expect(component.title).toBe('Succès');
  });
});
