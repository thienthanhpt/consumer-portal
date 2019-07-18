import { Component, OnInit, ViewChild } from '@angular/core';
import {
  BillingReport,
  BillingService,
  ConfigService,
  DataTableParams,
  LoaderService,
  ModalService,
  MyAccount,
  MyAccountService,
  TransactionService,
  PaymentSessionRequest,
  UtilService,
  Transaction,
  PaymentCard,
  DirectPaymentRequest,
  TransactionStatus,
} from '@app/core';
import { FORMAT_DATE, STORAGE_KEYS } from '@app/my-account/my-account.constant';
import * as _ from 'lodash';
import { LocalStorage } from '@ngx-pwa/local-storage';
import * as moment from 'moment';
import { Router } from '@angular/router';

declare let Checkout: any;

export function handleHostedCheckout(transaction: Transaction) {
  const el = document.querySelector('#paymentElement');
  if (!el) {
    const paymentScriptElement = document.createElement('script');
    paymentScriptElement.type = 'text/javascript';
    paymentScriptElement.src = 'https://ap-gateway.mastercard.com/checkout/version/51/checkout.js';
    paymentScriptElement.setAttribute('id', 'paymentElement');
    paymentScriptElement.onload = function() {
      Checkout.configure({
        merchant: transaction.paymentInfo.merchantId,
        order: {
          currency: 'SGD',
          description: transaction.otherInformation,
        },
        interaction: {
          merchant: {
            name: transaction.paymentInfo.name
          },
          displayControl : {
            billingAddress : 'HIDE'
          }
        },
        session: {
          id: transaction.paymentInfo.sessionId
        },
        transaction: {
          reference: transaction.transactionId
        }
      });
      Checkout.showPaymentPage();
    };
    document.body.appendChild(paymentScriptElement);
  } else {
    Checkout.configure({
      merchant: transaction.paymentInfo.merchantId,
      order: {
        currency: 'SGD',
        description: 'Pay bill',
      },
      interaction: {
        merchant: {
          name: transaction.paymentInfo.name
        },
        displayControl : {
          billingAddress : 'HIDE'
        }
      },
      session: {
        id: transaction.paymentInfo.sessionId
      },
      transaction: {
        reference: transaction.transactionId
      }
    });
    Checkout.showPaymentPage();
  }
}
@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {

  @ViewChild('warningModal') warningModal: any;
  @ViewChild('errorModal') errorModal: any;
  @ViewChild('alertModal') alertModal: any;
  @ViewChild('timeoutModal') timeoutModal: any;
  @ViewChild('warningRecurringServiceModal') warningRecurringServiceModal: any;
  paymentMethod = {};
  selectedConsumerId: number = null;
  indexConsumerSelected = 0;
  csPremises = [];
  premise = null;
  payAmount = null;
  isLoading = false;
  billingPagination: DataTableParams = {
    limit: 6,
    sortBy: 'period',
    sortAsc: false,
    offset: 0,
  };
  errorMessage = null;
  isSinglePayment = true;
  isSinglePaymentAndSaveCard = false;
  isSinglePaymentAndRecurring = false;
  isRecurringMethod = false;
  billingReport: BillingReport = null;
  config = { dateTimeFormat: null, validationRegex: null };
  account: MyAccount = new MyAccount();
  cardList: PaymentCard[] = [];
  selectedCard: PaymentCard = new PaymentCard();
  paymentAmountPattern: RegExp;
  constructor(public modal: ModalService,
              private router: Router,
              public loaderService: LoaderService,
              private localStorage: LocalStorage,
              private billingService: BillingService,
              private utilService: UtilService,
              private configService: ConfigService,
              private transactionService: TransactionService,
              private accountService: MyAccountService) {
    this.config.dateTimeFormat = configService.get('dateTimeFormat');
    this.config.validationRegex = configService.get('validationRegex');
    this.paymentAmountPattern = new RegExp(this.config.validationRegex.payAmount);
  }

  ngOnInit() {
    const urlHash = window.location.hash;
    if (urlHash && ((urlHash.indexOf('hc-action-cancel') >= 0) || (urlHash.indexOf('hc-action-timeout') >= 0))) {
      if (urlHash.indexOf('hc-action-timeout') >= 0) {// transaction timeout
        setTimeout(() => {
          this.modal.open(this.timeoutModal, 'md', { ignoreBackdropClick: false });
        }, 1000);
      }

      this.localStorage.getItem<{ [name: string]: any }>(STORAGE_KEYS.PAYMENT_VALIDATION_SESSION).subscribe(result => {
        const { transactionId, consumerId } = result;

        this.localStorage.removeItem(STORAGE_KEYS.PAYMENT_VALIDATION_SESSION).subscribe();

        const cancelledTransactionRQ = {
          consumer_id: consumerId,
          transactionid: transactionId,
          status: TransactionStatus.Cancelled
        };
        this.transactionService.changeTransactionStatus(cancelledTransactionRQ).subscribe();
      });
    }
    this.localStorage.getItem(STORAGE_KEYS.SELECTED_CONSUMER_ID).subscribe(id => {
      if (_.isEqual(this.selectedConsumerId, id)) {
        return;
      }
      this.selectedConsumerId = id;
      this.loaderService.loading();
      this.accountService.fetchAccount().subscribe(data => {
        this.loaderService.done();
        this.account = data;
        this.indexConsumerSelected = _.findIndex(data.customer.consumers, { id: id });
        _.forEach(data.customer.consumers, (consumer) => {
          const csPremise = {
            consumer: consumer,
            value: consumer.address
          };
          this.csPremises.push(csPremise);
          if (_.isEqual(id, consumer.id)) {
            this.premise = csPremise;
          }
        });
      });
      this.billingService.fetchCustomerBilling(id, this.billingPagination)
        .subscribe((billingReport: BillingReport) => {
          this.payAmount = billingReport.totalAmount ? billingReport.totalAmount.toFixed(2) : 0;
          this.billingReport = billingReport;
          this.loaderService.done();
      });
      this.getListCard(id);
    });
  }

  getAmountDue(value: number) {
    if (!value) {
      return 0;
    }
    return value.toFixed(2);
  }

  getFormatDD_MMM_YYYY(datetime: string): string {
    return datetime ? moment(datetime, FORMAT_DATE.DD_MM_YYYY).format(FORMAT_DATE.DD__MM__YYYY) : '';
  }

  onSelectPremise() {
    if (this.premise.consumer) {
      this.billingService.fetchCustomerBilling(this.premise.consumer.id, this.billingPagination)
        .subscribe((billingReport: BillingReport) => {
          this.payAmount = billingReport.totalAmount ? billingReport.totalAmount.toFixed(2) : 0;
          this.billingReport = billingReport;
          this.loaderService.done();
        });
      this.getListCard(this.premise.consumer.id);
    }
  }

  getListCard(consumerId: number) {
    this.transactionService.fetchCards(consumerId).subscribe((cards) => {
      if (cards) {
        this.cardList = _.chain(cards).filter(card => !_.isEmpty(card.cardNo)).map((item) => {
          item.displayNo = 'xxxx-xxxx-xxxx-' + item.cardNo.substr(item.cardNo.length - 4, 4);
          if (item.isAutoDeduct) {
            this.isRecurringMethod = true;
          }
          return item;
        }).value();
      }
      if (this.cardList.length > 0) {
        const newCard = new PaymentCard();
        newCard.displayNo = 'Add new card';
        this.cardList.push(newCard);
        this.selectedCard = this.cardList[0];
      }
    }, (err) => {
    });
  }

  onSelectionCard(card: PaymentCard) {
    this.selectedCard = card;
  }

  handleRedirect() {
    this.router.navigate(['/']);
  }

  handleHostedCheckout() {
    this.isLoading = true;
    if (!this.selectedCard.id || this.isSinglePaymentAndSaveCard) {
      const paymentRQ = new PaymentSessionRequest();
      paymentRQ.paidAmount = Number(this.payAmount);
      paymentRQ.date = moment().format(this.config.dateTimeFormat.completeDateTimeISOFormat);
      paymentRQ.paymentGateway = 'ocbc';
      paymentRQ.consumerId = this.premise.consumer.id;
      paymentRQ.returnUrl = window.location.origin + '/';
      this.transactionService.getTransactionSession(paymentRQ).subscribe((rs) => {
        rs.otherInformation = 'Pay bill';
        rs.consumerId = paymentRQ.consumerId;
        if (this.isSinglePaymentAndSaveCard) {
          rs.isAutoDeduct = false;
        }
        if (this.isSinglePaymentAndRecurring) {
          rs.isAutoDeduct = true;
        }
        if (this.isSinglePayment) {
          rs.isSinglePayment = true;
        }
        // save this info for later request payment token
        this.localStorage.setItem(STORAGE_KEYS.PAYMENT_VALIDATION_SESSION, rs).subscribe();
        handleHostedCheckout(rs);
      }, (error) => {
        this.openWarningModal(error);
      });
    } else {
      const directPaymentRQ = new DirectPaymentRequest();
      directPaymentRQ.cardId = this.selectedCard.id;
      directPaymentRQ.consumerId = this.premise.consumer.id;
      directPaymentRQ.paidAmount = +this.payAmount;
      if (this.isSinglePayment) {
        directPaymentRQ.isRecurring = false;
      }
      if (this.isSinglePaymentAndRecurring) {
        directPaymentRQ.isRecurring = true;
      }
      this.transactionService.handleDirectPayment(directPaymentRQ).subscribe((rs) => {
        this.modal.open(this.alertModal, 'md');
        this.isLoading = false;
      }, (err) => {
        this.handleErrorMsg(err);
        this.isLoading = false;
      });
    }
  }

  handleErrorMsg(error: any) {
    this.isLoading = false;
    this.errorMessage = error.message;
    this.modal.open(this.errorModal, 'md', { ignoreBackdropClick: false });
  }

  openWarningModal(message, config?: { [ key: string ]: any }) {
    const modal = config ? this.modal.config(config) : this.modal;
    this.errorMessage = message;
    modal.open(this.warningRecurringServiceModal, 'md', { ignoreBackdropClick: true });
  }

  changeRecurring(event: any) {
    if (this.isRecurringMethod) {
      event.preventDefault();
      this.modal.open(this.warningModal, 'md', { ignoreBackdropClick: true });
    } else {
      this.isSinglePayment = false;
      this.isSinglePaymentAndSaveCard = false;
      this.isSinglePaymentAndRecurring = true;
    }
  }

  isValidPaymentAmount(input: HTMLInputElement) {
    if (_.isEmpty(input.value) || !this.paymentAmountPattern.test(input.value)
      || input.valueAsNumber <= 0 || input.valueAsNumber > Number(this.billingReport.totalAmount.toFixed(2))) {
      return false;
    }
    return true;
  }

  changedRecurring() {
    this.isSinglePayment = false;
    this.isSinglePaymentAndSaveCard = false;
    this.isSinglePaymentAndRecurring = true;
    this.modal.hide();
  }

  paymentMethodChanged(paymentMethod: string) {
    if (_.isEmpty(this.paymentMethod)) {
      this.paymentMethod = {};
      this.paymentMethod[paymentMethod] = !this.paymentMethod[paymentMethod];
      return;
    }
    _.forEach(this.paymentMethod, (value: boolean, key: string) => {
      if (paymentMethod !== key) {
        this.paymentMethod[key] = false;
      }
    });
    this.paymentMethod[paymentMethod] = !this.paymentMethod[paymentMethod];
  }

}
