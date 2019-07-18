import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Event, NavigationEnd, Router } from '@angular/router';

import * as _ from 'lodash';

import { LocalStorage } from '@ngx-pwa/local-storage';

import { MY_ACCOUNT_ROUTES, STORAGE_KEYS } from '../my-account.constant';
import {AuthService, ConfigService, Consumer, LoaderService, ModalService, MyAccount, MyAccountService} from '@app/core';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
})
export class AccountComponent implements OnInit {

  @ViewChild('confirmModal') confirmModal: any;
  @ViewChild('changePwdModal') changePwdModal: any;
  @ViewChild('errorModal') errorModal: any;

  ROUTES = MY_ACCOUNT_ROUTES;
  activeRoute = MY_ACCOUNT_ROUTES.MANAGE_MY_ACCOUNT;
  isSideBarCollapsed = false;

  account: MyAccount;
  selectedConsumer: Consumer;
  changePwdRequest = {
    oldPassword: null,
    newPassword: null,
    confirmPassword: null
  };
  config = { bootstrap: null, validationRegex: null, dateTimeFormat: null };
  isFirstTimeLoggedIn = false;
  errorMessage: string = null;

  constructor(
    public modal: ModalService,
    public loaderService: LoaderService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private myAccountService: MyAccountService,
    private localStorage: LocalStorage,
    private configService: ConfigService,
  ) {
    this.account = new MyAccount();
    this.config.validationRegex = configService.get('validationRegex');
  }

  ngOnInit() {
    this.activeRoute = _.get(this.route, ['firstChild', 'snapshot', 'url', 0, 'path']) || MY_ACCOUNT_ROUTES.MANAGE_MY_ACCOUNT;
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.activeRoute = _.get(this.route, ['firstChild', 'snapshot', 'url', 0, 'path']) || MY_ACCOUNT_ROUTES.MANAGE_MY_ACCOUNT;
        this.isSideBarCollapsed = false;
      }
    });
    this.loaderService.loading();
    this.myAccountService.fetchAccount().subscribe(model => {
      this.loaderService.done();
      this.isFirstTimeLoggedIn = model.isFirstTimeLoggedIn;
      if (this.isFirstTimeLoggedIn) {
        this.changePwdRequest.oldPassword = model.tempPassword;
        this.modal.open(this.changePwdModal, 'md', { ignoreBackdropClick: true });
      }
      this.account = model;
      this.selectedConsumer = model.customer.consumers[0];
      this.localStorage.setItem(STORAGE_KEYS.SELECTED_CONSUMER_ID, this.selectedConsumer.id).subscribe();
    });
  }

  openChangePwdModal() {
    this.changePwdRequest = {
      oldPassword: null,
      newPassword: null,
      confirmPassword: null
    };
    this.modal.open(this.changePwdModal, 'md');
  }

  toggleSideBar() {
    this.isSideBarCollapsed = !this.isSideBarCollapsed;
  }

  logout() {
    this.authService.logout();
  }

  onChangePsw(form) {
    if (form.valid && this.isNewPswValid() && this.isConfirmPswValid()) {
      this.myAccountService.changePassword(this.changePwdRequest.newPassword, this.changePwdRequest.oldPassword).subscribe((rs) => {
        this.isFirstTimeLoggedIn = false;
        this.modal.hide();
        this.modal.open(this.confirmModal, 'md');
        this.changePwdRequest = {
          oldPassword: null,
          newPassword: null,
          confirmPassword: null
        };
      }, (err) => {
        this.handleErrorMsg(err);
      });
    }
  }

  onCalcelledChangePsw() {
    this.modal.hide();
    if (this.isFirstTimeLoggedIn) {
      this.logout();
    }
  }

  isConfirmPswValid() {
    const { newPassword, confirmPassword } = this.changePwdRequest;
    if (newPassword && newPassword !== confirmPassword) {
      return false;
    }
    return true;
  }

  isNewPswValid() {
    const { newPassword, oldPassword } = this.changePwdRequest;
    if (newPassword && newPassword === oldPassword) {
      return false;
    }
    return true;
  }

  handleErrorMsg(error: any) {
    this.errorMessage = error.message;
    this.modal.open(this.errorModal, 'md', { ignoreBackdropClick: false });
  }

  switchConsumer(consumer: Consumer) {
    this.selectedConsumer = consumer;
    this.localStorage.setItem(STORAGE_KEYS.SELECTED_CONSUMER_ID, consumer.id).subscribe();
  }
}
