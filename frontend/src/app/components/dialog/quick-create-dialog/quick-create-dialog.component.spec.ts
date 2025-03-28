import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickCreateDialogComponent } from './quick-create-dialog.component';

describe('QuickCreateDialogComponent', () => {
  let component: QuickCreateDialogComponent;
  let fixture: ComponentFixture<QuickCreateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickCreateDialogComponent]
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
