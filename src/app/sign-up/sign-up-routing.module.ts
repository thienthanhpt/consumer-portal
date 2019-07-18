import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {
  OrderComponent, DocumentsUploadComponent, EmaFactSheetComponent, OrderConfirmationComponent, OrderReviewComponent, PaymentModeComponent,
  PersonalParticularComponent, PlanDetailComponent, ServiceAddressComponent, PageNotFoundComponent, ORDER_ROUTES
} from './order';


const routes: Routes = [
  { path: ORDER_ROUTES.ORDER_CONFIRMATION, component: OrderConfirmationComponent },
  {
    path: '', component: OrderComponent, children: [
      { path: ORDER_ROUTES.PERSONAL_PARTICULAR, component: PersonalParticularComponent },
      { path: ORDER_ROUTES.SERVICE_ADDRESS, component: ServiceAddressComponent },
      { path: ORDER_ROUTES.PAYMENT_MODE, component: PaymentModeComponent },
      { path: ORDER_ROUTES.DOCUMENTS_UPLOAD, component: DocumentsUploadComponent },
      { path: ORDER_ROUTES.EMA_FACT_SHEET, component: EmaFactSheetComponent },
      { path: ORDER_ROUTES.ORDER_REVIEW, component: OrderReviewComponent },
      { path: ORDER_ROUTES.PLAN_DETAIL, component: PlanDetailComponent },
    ]
  },
  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class SignUpRoutingModule { }
