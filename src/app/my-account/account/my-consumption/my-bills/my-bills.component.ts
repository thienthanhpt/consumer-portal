import { Component, ViewChild, EventEmitter, Output, Input, OnChanges, SimpleChanges, Host } from '@angular/core';

import { MatPaginator, MatSort, MatTableDataSource, PageEvent } from '@angular/material';
import * as moment from 'moment';

import { Billing, ModalService } from '@app/core';
import { FORMAT_DATE } from '@app/my-account/my-account.constant';


enum PayStatus {
  PAID = 'paid',
  PENDING = 'pending',
  UNPAID = 'unpaid',
  OVERDUE = 'overdue',
  PARTIAL = 'partial',
  OVERDUE_PAID = 'overdue-paid'
}


@Component({
  selector: 'app-my-bills',
  templateUrl: './my-bills.component.html',
  styleUrls: [ './my-bills.component.scss' ]
})
export class MyBillsComponent implements OnChanges {

  @ViewChild('pdfViewer') pdfViewer: any;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  @Input() totalItems: number;
  @Input() items: Billing[];
  @Input() limit = 0;
  @Input() currentPage = 0;
  @Input() currentBillingId = null;
  @Output() onPageChanged: EventEmitter<any> = new EventEmitter<any>();
  @Output() onSortData: EventEmitter<any> = new EventEmitter<any>();

  pdfUrl = '';
  displayedColumns: string[] = [ 'invoiceDate', 'invoiceNo', 'period', 'usage', 'totalAmountPayable',
    'dueDate', 'status', 'view', 'download' ];
  dataSource: MatTableDataSource<Billing>;
  payStatus = PayStatus;

  constructor(
    public modal: ModalService) {
    this.dataSource = new MatTableDataSource([]);
    this.dataSource.sort = this.sort;
  }

  openPDF(url: string, e?: Event) {
    this.pdfUrl = 'https://' + url;
    setTimeout(() => {
      this.modal.open(this.pdfViewer, 'lg');
    }, 1000);
    e.preventDefault();
  }

  nextPage(event?: PageEvent) {
    this.onPageChanged.emit({
      offset: event.pageIndex * this.limit,
      pageIndex: event.pageIndex
    });
  }

  getFormatDD_MMM_YYYY(datetime: string): string {
    return datetime ? moment(datetime, FORMAT_DATE.DD_MM_YYYY).format(FORMAT_DATE.DD__MM__YYYY) : '';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.dataSource.data = this.items;
    }
  }

  sortData(event) {
    let sortAsc = null;
    if (!event.direction || event.active !== 'invoiceDate') {
      return;
    }
    if (event.direction === 'asc') {
      sortAsc = true;
    }
    this.onSortData.emit({
      sortAsc: sortAsc,
    });
  }
}
