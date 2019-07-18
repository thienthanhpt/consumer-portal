import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, Event, NavigationEnd } from '@angular/router';

import { LocalStorage } from '@ngx-pwa/local-storage';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { Order, OrderService, OrderPremise, CustomerType, GoogleTagManagerService } from '@app/core';
import { ModalService } from '@app/core';
import { STORAGE_KEYS, ORDER_ROUTES, ORDER_GA_EVENT_NAMES } from './order.constant';

// order of steps here will impact the "next" action
export const ENTER_DETAIL_STEP_ROUTES = [
  { link: ORDER_ROUTES.PLAN_DETAIL, title: '' },
  { link: ORDER_ROUTES.PERSONAL_PARTICULAR, title: '' },
  { link: ORDER_ROUTES.SERVICE_ADDRESS, title: '' },
];

export const UPLOAD_DOCUMENT_STEP_ROUTES = [
  { link: ORDER_ROUTES.DOCUMENTS_UPLOAD, title: '' },
];

export const REVIEW_STEP_ROUTES = [
  { link: ORDER_ROUTES.EMA_FACT_SHEET, title: '' },
  { link: ORDER_ROUTES.ORDER_REVIEW, title: '' },
];

enum OrderTab { EnterDetail, UploadDocuments, ReviewOrder }

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
})
export class OrderComponent implements OnInit, OnDestroy {

  @ViewChild('errorModal') errorModal: any;
  routerEventSubscription: Subscription;

  OrderTab = OrderTab;
  ENTER_DETAIL_STEP_ROUTES = ENTER_DETAIL_STEP_ROUTES;
  REVIEW_STEP_ROUTES = REVIEW_STEP_ROUTES;

  isSPAccountHolder = true;
  isAdvisoryAgreed = false;
  token = '';
  allStepRoutes = _.concat(ENTER_DETAIL_STEP_ROUTES, UPLOAD_DOCUMENT_STEP_ROUTES, REVIEW_STEP_ROUTES);
  activeTab: OrderTab;
  activeStepIndex = 0;
  errorModalMessage = '';
  errorModalTitle = '';

  currentStepIndex = 0;

  model: Order;

  constructor(
    public modal: ModalService,
    private dataService: OrderService,
    private localStorage: LocalStorage,
    private router: Router,
    private route: ActivatedRoute,
    private gtagService: GoogleTagManagerService,
  ) {
    this.initModel();
  }

  ngOnInit() {
    this.gtagService.sendEvent(ORDER_GA_EVENT_NAMES.OPEN_SIGN_UP);
    // detect current step and set tab
    // plan detail page doesn't have url
    const currentRoute = _.get(this.route, ['firstChild', 'snapshot', 'url', 0, 'path']) || ORDER_ROUTES.PLAN_DETAIL;

    this.localStorage.getItem<boolean>(STORAGE_KEYS.IS_SP_ACCOUNT_HOLDER).subscribe(isSPAccountHolder => {
      if (!_.isNull(isSPAccountHolder) ) {
        this.isSPAccountHolder = isSPAccountHolder;
      } else {
        this.isSPAccountHolder = true;
      }
    });
    this.localStorage.getItem<Order>(STORAGE_KEYS.ORDER).subscribe((order) => !order || (this.model.fromData(order)));
    this.localStorage.getItem<number>(STORAGE_KEYS.CURRENT_STEP_INDEX).subscribe((index) => {
      this.currentStepIndex = (index || 0);

      const personalParticularRouteIndex = _.findIndex(this.allStepRoutes, { link: ORDER_ROUTES.PERSONAL_PARTICULAR });

      this.activeStepIndex = _.findIndex(this.allStepRoutes, { link: currentRoute });
      if ((this.activeStepIndex <= this.currentStepIndex) && (this.activeStepIndex > personalParticularRouteIndex)) {
        const currentStep = this.allStepRoutes[personalParticularRouteIndex];
        this.navigateToLink(currentStep.link);
        this.updateCurrentTab(currentStep.link);
        this.activeStepIndex = personalParticularRouteIndex;
      } else if (this.activeStepIndex > this.currentStepIndex) {
        const currentStep = this.allStepRoutes[this.currentStepIndex];
        this.navigateToLink(currentStep.link);
        this.updateCurrentTab(currentStep.link);
        this.activeStepIndex = this.currentStepIndex;
      } else {
        this.updateCurrentTab(currentRoute);
      }
    });

    // Detecting route changed
    this.routerEventSubscription = this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        const route = _.get(this.route, ['firstChild', 'snapshot', 'url', 0, 'path']) || ORDER_ROUTES.PLAN_DETAIL;
        const stepRouteIndex = _.findIndex(this.allStepRoutes, { link: route });
        this.updateCurrentTab(this.allStepRoutes[ stepRouteIndex ].link);
        this.activeStepIndex = stepRouteIndex;
      }
    });
  }

  ngOnDestroy() {
    this.routerEventSubscription.unsubscribe();
  }

  initModel() {
    this.model = new Order();
    if (!this.model.premise) {
      this.model.premise = new OrderPremise();
    }
    // todo: currently only support for customer type residential, remove this code when support other types
    this.model.customerType = CustomerType.Residential;
  }

  saveAndNext(submitBtn?: HTMLInputElement) {
    const modelToStore = _.cloneDeep(this.model);
    // this.capitalizeUserInput(modelToStore);
    modelToStore.identificationName = '';
    modelToStore.identificationNo = '';
    modelToStore.email = '';
    modelToStore.mobileNo = '';
    this.localStorage.setItem(STORAGE_KEYS.ORDER, modelToStore.toData()).subscribe();

    // plan detail page doesn't have url
    const nextStepRouteIndex = this.activeStepIndex + 1;

    if (nextStepRouteIndex < (_.size(this.allStepRoutes))) {
      if (nextStepRouteIndex > this.currentStepIndex) {
        this.localStorage.setItem(STORAGE_KEYS.CURRENT_STEP_INDEX, nextStepRouteIndex).subscribe();
        this.currentStepIndex = nextStepRouteIndex;
      }

      const nextRoute = this.allStepRoutes[ nextStepRouteIndex ];
      this.navigateToLink(nextRoute.link);
    } else {
      if (!_.isEmpty(this.model)) {
        this.model.referralCode = (this.model.referralCode || '').toUpperCase();
        this.model.identificationName = (this.model.identificationName || '').toUpperCase();
        this.model.identificationNo = (this.model.identificationNo || '').toUpperCase();
        this.model.email = (this.model.email || '').toUpperCase();
        if (!_.isEmpty(this.model.premise)) {
          this.model.premise.serviceAddress += ' SINGAPORE ' + this.model.premise.servicePostalCode;
          this.model.premise.serviceAddress = this.model.premise.serviceAddress.toUpperCase();
        }
      }
      this.dataService.createOrder(this.model, this.token).subscribe(
        (rs) => {
          this.localStorage.clear().subscribe();
          this.navigateToLink(ORDER_ROUTES.ORDER_CONFIRMATION);
        },
        rs => {
          if (submitBtn) {
            submitBtn.disabled = false;
          }
          const errorStatus = _.get(rs, 'status');
          if ((errorStatus === 401) || (errorStatus === 403)) {
            this.token = null;
            this.openErrorModal('Errors', 'Your session was expired. Please go back to previous page and verify your mobile again.');
          } else {
            if (errorStatus === 400) {
              const errMessage = 'We have noticed some errors in your order. Please verify the following: ' + '<br />'
                + '<ul>'
                +   '<li>SP Account No</li>'
                + '</ul>'
                + 'Or contact our support: ' + '<a href="mailto:customercare@sunseap.com?subject=Support;">customercare@sunseap.com</a>';
              this.openErrorModal('Please verify your order and submit again.',
                _.get(rs, 'error.message', errMessage));
            } else {
              this.openErrorModal('Errors', _.get(rs, 'error.message'));
            }
          }
        }
      );
    }
  }

  openErrorModal(title, message, config?: { [key: string]: any }) {
    const modal = config ? this.modal.config(config) : this.modal;
    this.errorModalTitle = title;
    this.errorModalMessage = message;
    modal.open(this.errorModal, 'md', { ignoreBackdropClick: true });
  }

  clearLocalStorage() {
    _.each(STORAGE_KEYS, key => this.localStorage.removeItem(key).subscribe());
  }

  private navigateToLink(link: string) {
    this.router.navigate([ '/', link ], { relativeTo: this.route });
  }

  private updateCurrentTab(route: string) {
    if (_.find(ENTER_DETAIL_STEP_ROUTES, { link: route }) !== undefined) {
      this.activeTab = OrderTab.EnterDetail;
    } else if (_.find(UPLOAD_DOCUMENT_STEP_ROUTES, { link: route }) !== undefined) {
      this.activeTab = OrderTab.UploadDocuments;
    } else {
      this.activeTab = OrderTab.ReviewOrder;
    }
  }

}
