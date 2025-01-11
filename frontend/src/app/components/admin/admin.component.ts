import { Component} from '@angular/core';
import { AdminModule } from './admin.module';
import { IngredientAdminComponent } from './ingredient-admin/ingredient-admin.component';
import { ProductAdminComponent } from './product-admin/product-admin.component';
import { CategoryAdminComponent } from './category-admin/category-admin.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    AdminModule,
    CategoryAdminComponent,
    IngredientAdminComponent,
    ProductAdminComponent
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent {

}
