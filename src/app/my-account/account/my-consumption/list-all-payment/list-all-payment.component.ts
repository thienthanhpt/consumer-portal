import { Component, DoCheck } from '@angular/core';
import { DataTableParams, LoaderService, TransactionService, Transaction, TransactionsResponse } from '@app/core';
import { STORAGE_KEYS } from '@app/my-account/my-account.constant';
import { LocalStorage } from '@ngx-pwa/local-storage';
import * as _ from 'lodash';
import { PageEvent } from '@angular/material';

@Component({
  selector: 'app-list-all-payment',
  templateUrl: './list-all-payment.component.html',
  styleUrls: ['./list-all-payment.component.scss']
})
export class ListAllPaymentComponent implements DoCheck {

  listTransaction: Transaction[];
  selectedConsumerId: number = null;
  transactionPagination: DataTableParams = {
    limit: 6,
    sortBy: 'paymentDate',
    sortAsc: false,
    offset: 0,
  };
  totalCount = 0;
  currentPage = 0;

  constructor(private localStorage: LocalStorage,
              private transactionService: TransactionService,
              public loaderService: LoaderService) { }

  ngDoCheck() {
    this.localStorage.getItem<number>(STORAGE_KEYS.SELECTED_CONSUMER_ID).subscribe(id => {
      if (_.isEqual(this.selectedConsumerId, id)) {
        return;
      }

      this.selectedConsumerId = id;
      if (this.selectedConsumerId) {
        this.loaderService.loading();
        this.loadTransactionsHistory(this.transactionPagination);
      }
    });
  }

  loadTransactionsHistory(params: DataTableParams) {
    this.localStorage.getItem<number>(STORAGE_KEYS.SELECTED_CONSUMER_ID).subscribe(consumerId => {
      if (consumerId) {
        this.transactionService.fetchConsumerPayments(consumerId, params)
          .subscribe((listTransactionRS: TransactionsResponse) => {
            this.loaderService.done();
            this.listTransaction = listTransactionRS.data;
            this.totalCount = listTransactionRS.meta.count;
          });
      }
    });
  }

  onSortTransactions(event) {
    if (event) {
      this.transactionPagination.sortAsc = event.sortAsc;
    }
    this.loadTransactionsHistory(this.transactionPagination);
  }

  reloadTransactionHistory(event) {
    this.currentPage = event.pageIndex;
    this.loaderService.loading();
    this.transactionPagination.offset = event.offset;
    this.loadTransactionsHistory(this.transactionPagination);
  }

  nextPage(event?: PageEvent) {
    this.loaderService.loading();
    this.currentPage = event.pageIndex;
    this.transactionPagination.offset = event.pageIndex * this.transactionPagination.limit;
    this.loadTransactionsHistory(this.transactionPagination);
  }

}
