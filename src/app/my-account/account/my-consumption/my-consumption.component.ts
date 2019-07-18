import {Component, DoCheck, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';

import { Chart } from 'chart.js';
import * as _ from 'lodash';
import * as moment from 'moment';
import { LocalStorage } from '@ngx-pwa/local-storage';

import {
  Billing,
  BillingReport,
  BillingService, ConfigService,
  DataTableParams,
  LoaderService,
  ModalService,
  TransactionService, Transaction, TransactionsResponse,
  UtilService, TransactionStatus
} from '@app/core';
import { STORAGE_KEYS, MY_ACCOUNT_ROUTES, FORMAT_DATE } from '../../../my-account/my-account.constant';
import { ActivatedRoute, Router } from '@angular/router';
import { AppConfig } from '@app/core/configs/app.config';

enum ChartType {
  PastInvoice = 'pastInvoice',
  Electricity = 'electricity',
}

enum BillsViewType {
  Chart = 'chart',
  Table = 'table',
}

enum PageChangedType {
  Previous = 'previous',
  Next = 'next'
}

const customTooltip = function (tooltipModel, data, chartPeriodText, chartValueText, type) {
  // Tooltip Element
  let tooltipEl: any = document.getElementById('chartjs-tooltip');

  // Create element on first render
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'chartjs-tooltip';
    tooltipEl.innerHTML = '<table></table>';
    document.body.appendChild(tooltipEl);
  }

  // Hide if no tooltip
  if (tooltipModel.opacity === 0) {
    tooltipEl.style.opacity = 0;
    return;
  }

  // Set caret Position
  tooltipEl.classList.remove('above', 'below', 'no-transform');
  if (tooltipModel.yAlign) {
    tooltipEl.classList.add(tooltipModel.yAlign);
  } else {
    tooltipEl.classList.add('no-transform');
  }

  function getBody(bodyItem) {
    return bodyItem.lines;
  }

  // Set Text
  if (tooltipModel.body) {
    // TODO: the field might changed from server, leave it temporary here
    const period = data[tooltipModel.dataPoints[0].index].usageFromDate + ' - ' + data[tooltipModel.dataPoints[0].index].usageToDate;
    const value = tooltipModel.body.map(getBody)[0];

    let innerHtml = '<tbody>';
    innerHtml += '<tr><td><b>' + chartPeriodText + '</b>: ' + period + '</td></tr>';
    if (type === 'line') {
      innerHtml += '<tr><td><div style="white-space: nowrap; padding-top: 5px;"><b>' + chartValueText + '</b>: '
        + Number(value).toFixed(2) + 'kWh' + '</div></td></tr>';
      innerHtml += '</tbody>';
    } else {
      innerHtml += '<tr><td><div style="white-space: nowrap; padding-top: 5px;"><b>' + chartValueText + '</b>: '
        + 'S$' + Number(value).toFixed(2) + '</div></td></tr>';
      innerHtml += '</tbody>';
    }

    const tableRoot = tooltipEl.querySelector('table');
    tableRoot.innerHTML = innerHtml;
  }

  // `this` will be the overall tooltip
  const position = this._chart.canvas.getBoundingClientRect();

  // Display, position, and set styles for font
  tooltipEl.style.opacity = 1;
  tooltipEl.style.position = 'absolute';
  tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
  tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
  tooltipEl.style.fontFamily = tooltipModel._bodyFontFamily;
  tooltipEl.style.fontSize = tooltipModel.bodyFontSize + 'px';
  tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle;
  tooltipEl.style.padding = '10px';
  tooltipEl.style.pointerEvents = 'none';
};

@Component({
  selector: 'app-my-consumption',
  templateUrl: './my-consumption.component.html',
})
export class MyConsumptionComponent implements DoCheck, OnDestroy, OnInit {
  @ViewChild('chartLargerModal') chartLargerModal: ElementRef;
  @Input() consumerId: number = null;
  @ViewChild('alertModal') alertModal: any;

  ROUTES = MY_ACCOUNT_ROUTES;
  pastInvoice: Chart;
  electricityConsumption: Chart;
  chartLarger = [];
  listMonths = [];
  billPeriod = [];
  usageAmountList = Array.apply(null, Array(6)).map(Number.prototype.valueOf, 0);
  totalAmountPayableList = Array.apply(null, Array(6)).map(Number.prototype.valueOf, 0);
  totalBillCount = 0;
  totalElectricBillCount = 0;
  totalPastBillsCount = 0;
  billingReport: BillingReport = null;
  listBill: Billing[] = [];
  listTransaction: Transaction[] = [];
  currentPage = 0;
  currentElectricPage = 0;
  currentPastPage = 0;
  config = { dateTimeFormat: null};

  billingPagination: DataTableParams = {
    limit: 6,
    sortBy: 'period',
    sortAsc: false,
    offset: 0,
    fromDate: moment().subtract(5, 'months').startOf('month')
      .format(AppConfig.dateTimeFormat.dateApi),
    toDate: moment().endOf('month').format(AppConfig.dateTimeFormat.dateApi)
  };

  transactionPagination: DataTableParams = {
    limit: 6,
    sortBy: 'paymentDate',
    sortAsc: false,
    offset: 0,
  };

  electricPagination: DataTableParams = {
    limit: 6,
    sortBy: 'period',
    sortAsc: false,
    offset: 0,
  };

  pastBillsPagination: DataTableParams = {
    limit: 6,
    sortBy: 'period',
    sortAsc: false,
    offset: 0,
  };

  selectedBillViewType = BillsViewType.Table;
  billsViewType = BillsViewType;
  pageChangedType = PageChangedType;
  chartType = ChartType;

  pastInvoiceChart = {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        borderWidth: 1,
        data: [],
        fill: false,
        borderColor: '#509da4',
        backgroundColor: '#509da4',
      }]
    },
    options: {
      scales: {
        xAxes: [{
          barPercentage: 0.5,
          maxBarThickness: 50,
          barPercentsage: 0.5,
          categoryPercentage: 0.8,
          gridLines: {
            color: 'rgba(0, 0, 0, 0)',
          },
          ticks: {
            callback: function(value) {
              if (_.isEmpty(value)) {
                return '';
              }
              return moment(value.billPeriod.toString(), FORMAT_DATE.YYYYMM).format(FORMAT_DATE.DATE_FORMAT_MMM_YY);
            }
          }
        }],
        yAxes: [{
          ticks: {
            callback: function(value) {
              return 'S$ ' + value;
            }
          }
        }]
      },
      legend: {
        display: false
      },
      tooltips: {
        enabled: false,
        custom: function (tooltipModel) {
          customTooltip.bind(this)(tooltipModel, this._data.labels, 'Invoice period', 'Total payable amount', 'bar');
        }
      }
    }
  };

  electricityConsumptionChart = {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        pointHitRadius: 5,
        borderWidth: 1,
        data: [],
        fill: true,
        borderColor: 'rgba(0, 0, 0, 0.5)',
        backgroundColor: null,
      }]
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        ticks: {
          max: 5,
          min: 0,
          stepSize: 0.2,
        },
        xAxes: [{
          maxBarThickness: 40,
          barPercentage: 0.5,
          gridLines: {
            color: 'rgba(0, 0, 0, 0)',
          },
          ticks: {
            callback: function(value) {
              if (_.isEmpty(value)) {
                return '';
              }
              return moment(value.invoiceDate.toString(), FORMAT_DATE.DD_MM_YYYY).format(FORMAT_DATE.DATE_FORMAT_MMM_YY);
            }
          }
        }],
        yAxes: [{
          ticks: {
            callback: function(value) {
              return value + ' kWh';
            }
          }
        }]
      },
      legend: {
        display: false
      },
      tooltips: {
        enabled: false,
        yAlign: 'top',
        custom: function (tooltipModel) {
          customTooltip.bind(this)(tooltipModel, this._data.labels, 'Invoice period', 'Usage', 'line');
        }
      }
    }
  };

  selectedConsumerId: number = null;

  constructor(
    public modal: ModalService,
    private billingService: BillingService,
    private localStorage: LocalStorage,
    public loaderService: LoaderService,
    private utilService: UtilService,
    private transactionService: TransactionService,
    private configService: ConfigService,
    private router: Router,
    private activeRoute: ActivatedRoute
  ) {
    this.config.dateTimeFormat = configService.get('dateTimeFormat');
  }

  ngDoCheck() {
    this.localStorage.getItem<number>(STORAGE_KEYS.SELECTED_CONSUMER_ID).subscribe(id => {
      if (_.isEqual(this.selectedConsumerId, id)) {
        return;
      }
      this.selectedConsumerId = id;
      if (this.selectedConsumerId) {
        this.loaderService.loading();
        this.loadBills(this.billingPagination);
        this.loadTransactionsHistory(this.transactionPagination);
      }
    });
  }

  ngOnInit(): void {
    this.activeRoute.queryParams.subscribe(params => {
      if (params['resultIndicator']) {
        this.localStorage.getItem<{ [name: string]: any }>(STORAGE_KEYS.PAYMENT_VALIDATION_SESSION).subscribe(result => {
          const { successIndicator, sessionId } = result.paymentInfo;
          const { paymentTransaction, consumerId, isAutoDeduct, isSinglePayment } = result;

          if (params['resultIndicator'] === successIndicator) {
            setTimeout(() => {
              this.modal.open(this.alertModal, 'md', { ignoreBackdropClick: false });
            }, 1000);

            this.localStorage.removeItem(STORAGE_KEYS.PAYMENT_VALIDATION_SESSION).subscribe();

            if (!isSinglePayment) {
              const createTokenRQ = {
                consumer_id: consumerId,
                session_id: sessionId,
                transactionid: paymentTransaction,
                is_auto_deduct: isAutoDeduct
              };
              this.transactionService.createToken(createTokenRQ).subscribe();
            }

            const submittedTransactionRQ = {
              consumer_id: consumerId,
              transactionid: paymentTransaction,
              status: TransactionStatus.Submitted
            };
            this.transactionService.changeTransactionStatus(submittedTransactionRQ).subscribe();
          }
        });
      }
    });
  }

  closeAlertModal() {
    this.modal.hide();
    setTimeout(() => {
      window.location.reload(); // Recurring card does not show up after payment success
    }, 1000); // Solution is refresh after 1s
  }

  loadBills(params: DataTableParams, viewType = '') {
    this.localStorage.getItem<number>(STORAGE_KEYS.SELECTED_CONSUMER_ID).subscribe(consumerId => {
      if (consumerId) {
        this.billingService.fetchCustomerBilling(consumerId, params)
          .subscribe((billingReport: BillingReport) => {
            switch (viewType) {
              case BillsViewType.Table:
                this.billingReport = billingReport;
                this.totalBillCount = billingReport.meta.count;
                this.listBill = billingReport.billingList;
                break;
              case ChartType.Electricity:
                this.totalElectricBillCount = billingReport.meta.count;
                this.buildElectricChart(billingReport.billingList);
                break;
              case ChartType.PastInvoice:
                this.totalPastBillsCount = billingReport.meta.count;
                this.buildPastInvoiceChart(billingReport.billingList);
                break;
              default:
                this.billingReport = billingReport;
                this.totalBillCount = billingReport.meta.count;
                this.listBill = billingReport.billingList;
                this.buildElectricChart(billingReport.billingList);
                this.buildPastInvoiceChart(billingReport.billingList);
            }
            this.loaderService.done();
          });
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
          });
      }
    });
  }

  openChartLarger(chart) {
    this.modal.open(this.chartLargerModal, 'lg', { backdrop: 'static' });
    if (_.isEqual(chart, ChartType.Electricity)) {
      this.electricityConsumptionChart.options.maintainAspectRatio = true;
      this.chartLarger = new Chart('chartLarger', this.electricityConsumptionChart);
    }
  }

  buildElectricChart(billingList: Billing[]) {
    if (this.electricityConsumption != null) {
      this.electricityConsumption.destroy();
    }
    if (billingList) {
      this.listMonths = [];
      this.usageAmountList = Array.apply(null, Array(6)).map(Number.prototype.valueOf, 0);
      billingList.forEach((bill, index) => {
        this.usageAmountList[index] = bill.usageAmount;
        this.listMonths[index] = bill;
      });

      while (this.listMonths.length < 6) {
        this.listMonths.push('');
      }

      this.electricityConsumptionChart.data.datasets[0].data = _.reverse(this.usageAmountList);
      this.electricityConsumptionChart.data.labels = _.reverse(this.listMonths);

      const canvasElectricity = <HTMLCanvasElement> document.getElementById('electricityConsumption');
      const ctxElectricity = canvasElectricity.getContext('2d');
      const gradient = ctxElectricity.createLinearGradient(0, 50, 0, 200);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
      gradient.addColorStop(1, 'rgba(192,192,192, 0.1)');
      this.electricityConsumptionChart.data.datasets[0].backgroundColor = gradient;
      if (this.selectedBillViewType == null) {
        this.selectedBillViewType = BillsViewType.Table;
      }
      this.electricityConsumption = new Chart(ctxElectricity, this.electricityConsumptionChart);
    }
  }

  getFullDate(datetime): string {
    return datetime ? moment(datetime, FORMAT_DATE.DD_MM_YYYY).format(FORMAT_DATE.FULL_TEXT_DATE) : '';
  }

  getMonthOfYear(datetime: string): string {
    return moment(datetime, FORMAT_DATE.DD_MM_YYYY).format(FORMAT_DATE.MONTH_FORMAT);
  }

  onSortData(event) {
    if (event) {
      this.billingPagination.sortAsc = event.sortAsc;
    }
    this.loadBills(this.billingPagination, BillsViewType.Table);
  }

  isPayable(paymentAmount: number) {
    return paymentAmount && Math.round(paymentAmount * 100) / 100 > 0;
  }

  onSortTransactions(event) {
    if (event) {
      this.transactionPagination.sortAsc = event.sortAsc;
    }
    this.loadTransactionsHistory(this.transactionPagination);
  }

  buildPastInvoiceChart(billingList: Billing[]) {
    if (this.pastInvoice != null) {
      this.pastInvoice.destroy();
    }
    if (billingList) {
      this.billPeriod = [];
      this.totalAmountPayableList = Array.apply(null, Array(6)).map(Number.prototype.valueOf, 0);

      billingList.forEach((bill, index) => {
        this.totalAmountPayableList[index] = bill.totalAmountPayable;
        this.billPeriod[index] = bill;
      });

      while (this.billPeriod.length < 6) {
        this.billPeriod.push('');
      }
    }

    this.pastInvoiceChart.data.datasets[0].data = _.reverse(this.totalAmountPayableList);
    this.pastInvoiceChart.data.labels = _.reverse(this.billPeriod);
    this.pastInvoice = new Chart('pastInvoice', this.pastInvoiceChart);
  }

  onPageChange(changeType, chartType) {
    if (_.isEqual(chartType, ChartType.PastInvoice)) {
      if (_.isEqual(changeType, PageChangedType.Previous)) {
        this.currentPastPage--;
      } else {
        this.currentPastPage++;
      }
      this.pastBillsPagination.offset = this.currentPastPage * this.pastBillsPagination.limit;
      this.loadBills(this.pastBillsPagination, chartType);
    } else {
      if (_.isEqual(changeType, PageChangedType.Previous)) {
        this.currentElectricPage--;
      } else {
        this.currentElectricPage++;
      }
        this.electricPagination.offset = this.currentElectricPage * this.electricPagination.limit;
        this.loadBills(this.electricPagination, chartType);
    }
  }

  handleHostedCheckout() {
    this.router.navigate(['/pay-bill']);
  }

  ngOnDestroy(): void {
    (window as any).removeAllListeners('message');
  }
}
