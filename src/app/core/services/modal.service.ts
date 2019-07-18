import { Injectable, TemplateRef } from '@angular/core';

import { BsModalService, BsModalRef, ModalOptions } from 'ngx-bootstrap';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

export interface ModalConfig {
  events?: {
    onShow?: (reason: string) => void;
    onShown?: (reason: string) => void;
    onHide?: (reason: string) => void;
    onHidden?: (reason: string) => void;
  };
}

@Injectable()
export class ModalService {

  modalStack: BsModalRef[] = [];

  private hasModalConfig = false;
  private modalConfig: ModalConfig = {};
  private subscriptions: Subscription[] = [];

  constructor(
    protected modalService: BsModalService,
  ) { }

  config(config: ModalConfig) {
    this.modalConfig = config;
    this.hasModalConfig = true;

    return this;
  }

  open(template: TemplateRef<any> | any, sizeClass: 'sm' | 'md' | 'lg' = 'sm', extraOption?: ModalOptions) {
    const options: ModalOptions = { class: `modal-${sizeClass}`, animated: true, keyboard: false };
    if (extraOption) {
      if (extraOption.class) {
        options.class += ' ' + extraOption.class;
        delete extraOption.class;
      }
      _.assign(options, extraOption);
    }

    if (this.hasModalConfig) {
      if (!_.isEmpty(this.modalConfig.events)) {
        _.forEach(['onShow', 'onShown', 'onHide'], (eventName: 'onShow' | 'onShown' | 'onHide') => {
          if (_.has(this.modalConfig.events, eventName)) {
            this.subscriptions.push(this.modalService[eventName].subscribe((reason: string) => {
              this.modalConfig.events[eventName](reason);
            }));
          }
        });
        this.subscriptions.push(
          this.modalService.onHidden.subscribe((reason: string) => {
            if (_.has(this.modalConfig.events, 'onHidden')) {
              this.modalConfig.events.onHidden(reason);
            }
            this.unsubscribe();
          })
        );
      }

      // reset modal configs
      this.hasModalConfig = false;
      // this.modalConfig = {};
    }

    const ref = this.modalService.show(template, options);
    this.modalStack.push(ref);
  }

  hide = () => {
    const ref = this.modalStack.pop();
    ref.hide();
  }

  hideAll = () => {
    while (this.modalStack.length > 0) {
      const ref = this.modalStack.pop();
      ref.hide();
    }
  }

  private unsubscribe() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions = [];
  }
}
