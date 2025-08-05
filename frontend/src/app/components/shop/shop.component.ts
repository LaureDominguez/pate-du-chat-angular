import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MATERIAL_IMPORTS } from '../../app-material';

@Component({
    selector: 'app-shop',
    imports: [
        MATERIAL_IMPORTS,
    ],
    templateUrl: './shop.component.html',
    styleUrls: ['./shop.component.scss']
})
export class ShopComponent {
}
