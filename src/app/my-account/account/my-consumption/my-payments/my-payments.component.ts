import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatSort, MatTableDataSource } from '@angular/material';
import { Transaction, TransactionStatus, TransactionTypes } from '@app/core';

@Component({
  selector: 'app-my-payments',
  templateUrl: './my-payments.component.html',
  styleUrls: ['./my-payments.component.scss']
})
export class MyPaymentsComponent implements OnChanges {

  @ViewChild(MatSort) sort: MatSort;
  @Input() items: Transaction[];
  @Output() onSortData: EventEmitter<any> = new EventEmitter<any>();

  dataSource: MatTableDataSource<Transaction>;
  transactionStatus = TransactionStatus;
  transactionTypes = TransactionTypes;
  displayedColumns: string[] = [ 'paymentDate', 'paymentTransaction', 'paidAmount', 'status', 'paymentGateway', 'paymentNote'];

  constructor() {
    this.dataSource = new MatTableDataSource([]);
    this.dataSource.sort = this.sort;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.dataSource.data = this.items;
    }
  }

  sortData(event) {
    let sortAsc = null;
    if (!event.direction || event.active !== 'paymentDate') {
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
