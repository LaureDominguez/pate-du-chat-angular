import { MatPaginatorIntl } from '@angular/material/paginator';
import { getFrenchPaginatorIntl } from '../../../assets/utils/french-paginator-intl';

export const ADMIN_SHARED_PROVIDERS = [
    { provide: MatPaginatorIntl, useValue: getFrenchPaginatorIntl() }
];
