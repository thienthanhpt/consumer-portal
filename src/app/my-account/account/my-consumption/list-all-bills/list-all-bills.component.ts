import { Component, DoCheck } from '@angular/core';
import { STORAGE_KEYS } from '@app/my-account/my-account.constant';
import * as _ from 'lodash';
import {Billing, BillingReport, BillingService, DataTableParams, LoaderService, ModalService} from '@app/core';
import { LocalStorage } from '@ngx-pwa/local-storage';
import {PageEvent} from '@angular/material';

enum BillsViewType {
  Chart = 'chart',
  Table = 'table',
}

@Component({
  selector: 'app-list-all-bills',
  templateUrl: './list-all-bills.component.html'
})
export class ListAllBillsComponent implements DoCheck {
  selectedBillViewType = BillsViewType.Table;
  billsViewType = BillsViewType;

  billingPagination: DataTableParams = {
    sortBy: 'period',
    sortAsc: false,
    offset: 0,
  };
  totalBillCount = 0;
  billingReport: BillingReport = null;
  listBill: Billing[] = [];
  currentPage = 0;
  selectedConsumerId: number = null;

  constructor(
    public modal: ModalService,
    private billingService: BillingService,
    private localStorage: LocalStorage,
    public loaderService: LoaderService
  ) { }

  ngDoCheck() {
    this.localStorage.getItem<number>(STORAGE_KEYS.SELECTED_CONSUMER_ID).subscribe(id => {
      if (_.isEqual(this.selectedConsumerId, id)) {
        return;
      }
      this.selectedConsumerId = id;
      if (this.selectedConsumerId) {
        this.loaderService.loading();
        this.loadBills(this.billingPagination);
      }
    });
  }

  loadBills(params: DataTableParams) {
    this.localStorage.getItem<number>(STORAGE_KEYS.SELECTED_CONSUMER_ID).subscribe(consumerId => {
      if (consumerId) {
        this.billingService.fetchCustomerBilling(consumerId, params)
          .subscribe((billingReport: BillingReport) => {
            this.billingReport = billingReport;
            this.totalBillCount = billingReport.meta.count;
            this.listBill = billingReport.billingList;
            this.loaderService.done();
          });
      }
    });
  }

  reloadBills(event) {
    this.currentPage = event.pageIndex;
    this.loaderService.loading();
    this.billingPagination.offset = event.offset;
    this.loadBills(this.billingPagination);
  }

  onSortData(event) {
    if (event) {
      this.billingPagination.sortAsc = event.sortAsc;
    }
    this.loadBills(this.billingPagination);
  }

  nextPage(event?: PageEvent) {
    this.loaderService.loading();
    this.currentPage = event.pageIndex;
    this.billingPagination.offset = event.pageIndex * this.billingPagination.limit;
    this.loadBills(this.billingPagination);
  }

}
