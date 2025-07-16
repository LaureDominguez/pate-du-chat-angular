import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShopGridComponent } from './shop-grid.component';
import { ProductService } from '../../../services/product.service';
import { ImageService } from '../../../services/image.service';
import { of } from 'rxjs';

describe('ShopGridComponent', () => {
  let component: ShopGridComponent;
  let fixture: ComponentFixture<ShopGridComponent>;
  let mockProductService: any;
  let mockImageService: any;

  beforeEach(async () => {
    mockProductService = {
      getFinalProducts: jasmine.createSpy('getFinalProducts').and.returnValue(of([
        { id: '1', name: 'Product 1', price: 10 },
        { id: '2', name: 'Product 2', price: 20 }
      ]))
    };

    mockImageService = {
      getImageUrl: jasmine.createSpy('getImageUrl').and.callFake((path: string) => `http://localhost:4200/api/images/${path}`)
    };

    await TestBed.configureTestingModule({
      imports: [
        ShopGridComponent // ✅ Standalone, donc importé directement
      ],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService
        },
        {
          provide: ImageService,
          useValue: mockImageService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShopGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });
});
