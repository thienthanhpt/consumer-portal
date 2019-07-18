import { Component, OnInit, Host } from '@angular/core';
import { Router } from '@angular/router';

import { LocalStorage } from '@ngx-pwa/local-storage';

import { GoogleTagManagerService, PricingPlan } from '@app/core';
import { OrderComponent } from '../order.component';
import { ORDER_GA_EVENT_NAMES, STORAGE_KEYS } from '../order.constant';

@Component({
  selector: 'app-ema-fact-sheet',
  templateUrl: './ema-fact-sheet.component.html',
})
export class EmaFactSheetComponent implements OnInit {

  confirmationChecked = false;
  policyChecked = false;
  emaFactSheetImageFileName: string;
  emaFactSheetPdfFileName: string;

  constructor(
    @Host() public parent: OrderComponent,
    private localStorage: LocalStorage,
    private gtagService: GoogleTagManagerService,
    private router: Router,
  ) { }

  ngOnInit() {

    this.localStorage.getItem<PricingPlan>(STORAGE_KEYS.PRICING_PLAN)
      .subscribe(selectedPricingPlan => {
        if (selectedPricingPlan) {
          this.emaFactSheetPdfFileName = 'https://' + selectedPricingPlan.factSheetPDF;
          this.emaFactSheetImageFileName = 'https://' + selectedPricingPlan.factSheetPNG;
        } else {
          this.parent.clearLocalStorage();
          const modalConfig: { [ key: string ]: any } = {
            events: {
              onHidden: (reason: string) => {
                this.parent.modal.hide();
                this.router.navigate(['']);
              }
            }
          };
          this.parent.openErrorModal('Errors', 'You need to select your pricing plan first!', modalConfig);
        }
      });
  }

  onAckFactsheetClick() {
    if (!this.confirmationChecked) {
      this.gtagService.sendEvent(ORDER_GA_EVENT_NAMES.ACK_FACTSHEET);
    }
  }

  onAckTermAndConditionClick() {
    if (!this.policyChecked) {
      this.gtagService.sendEvent(ORDER_GA_EVENT_NAMES.ACK_TERM_AND_CONDITION);
    }
  }

  onSubmit() {
    if (this.confirmationChecked && this.policyChecked) {
      this.gtagService.sendEvent(ORDER_GA_EVENT_NAMES.REVIEW_ORDER_1);
      this.parent.saveAndNext();
    }
  }
}
