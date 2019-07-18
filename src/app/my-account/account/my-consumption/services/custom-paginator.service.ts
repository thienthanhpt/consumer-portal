import { MatPaginatorIntl } from '@angular/material';
export class CustomPaginatorService extends MatPaginatorIntl {
  itemsPerPageLabel = 'Items per page:';
  nextPageLabel     = '';
  previousPageLabel = '';
  lastPageLabel = '';
  firstPageLabel = '';

}
