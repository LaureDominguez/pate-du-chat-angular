import { MatPaginatorIntl } from '@angular/material/paginator';

export function getFrenchPaginatorIntl(): MatPaginatorIntl {
    const paginatorIntl = new MatPaginatorIntl();

    paginatorIntl.itemsPerPageLabel = 'Éléments par page :';
    paginatorIntl.nextPageLabel = 'Page suivante';
    paginatorIntl.previousPageLabel = 'Page précédente';
    paginatorIntl.firstPageLabel = 'Première page';
    paginatorIntl.lastPageLabel = 'Dernière page';

    paginatorIntl.getRangeLabel = (
        page: number,
        pageSize: number,
        length: number
    ): string => {
        if (length === 0 || pageSize === 0) {
            return `Page 1 sur 1`;
        }

        const startIndex = page * pageSize;
        const endIndex = Math.min(startIndex + pageSize, length);
        const totalPages = Math.ceil(length / pageSize);

        return `Page ${page + 1} sur ${totalPages}`;
    };

    return paginatorIntl;
}
