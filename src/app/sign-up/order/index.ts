import { OrderComponent } from './order.component';
import { DocumentsUploadComponent } from './documents-upload/documents-upload.component';
import { EmaFactSheetComponent } from './ema-fact-sheet/ema-fact-sheet.component';
import { OrderConfirmationComponent } from './order-confirmation/order-confirmation.component';
import { OrderReviewComponent } from './order-review/order-review.component';
import { PaymentModeComponent } from './payment-mode/payment-mode.component';
import { PersonalParticularComponent } from './personal-particular/personal-particular.component';
import { PlanDetailComponent } from './plan-detail/plan-detail.component';
import { ServiceAddressComponent } from './service-address/service-address.component';
import { DocumentUploadInputComponent } from './documents-upload/document-upload-input.component';
import { ORDER_ROUTES } from './order.constant';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';


export {
  OrderComponent, DocumentsUploadComponent, EmaFactSheetComponent, OrderConfirmationComponent, OrderReviewComponent, PaymentModeComponent,
  PersonalParticularComponent, PlanDetailComponent, ServiceAddressComponent, PageNotFoundComponent, ORDER_ROUTES,
};

export const ORDER_COMPONENTS = [
  OrderComponent, DocumentsUploadComponent, EmaFactSheetComponent, OrderConfirmationComponent, OrderReviewComponent, PaymentModeComponent,
  PersonalParticularComponent, PlanDetailComponent, ServiceAddressComponent, DocumentUploadInputComponent, PageNotFoundComponent
];
