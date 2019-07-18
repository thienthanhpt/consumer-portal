import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { AccountComponent, ListAllPaymentComponent, MyConsumptionComponent, MyDetailsComponent } from './account';
import { RecoveryPasswordComponent, LoginComponent } from './auth';
import { AuthGuard } from '@app/core/guards/auth.guard';
import { MY_ACCOUNT_ROUTES } from './my-account.constant';
import { ListAllBillsComponent } from './account/my-consumption/list-all-bills/list-all-bills.component';
import { PaymentComponent } from './account/payment/payment.component';
import { SupportComponent } from '@app/my-account/account/support/support.component';

const routes: Routes = [
  { path: MY_ACCOUNT_ROUTES.LOGIN, component: LoginComponent },
  { path: MY_ACCOUNT_ROUTES.RECOVERY_PASSWORD, component: RecoveryPasswordComponent },
  { path: '',
    component: AccountComponent,
    canActivate: [AuthGuard],
    children: [
      // { path: MY_ACCOUNT_ROUTES.MY_CONSUMPTION, component: MyConsumptionComponent },
      { path: MY_ACCOUNT_ROUTES.MY_CONSUMPTION, redirectTo: '/' + MY_ACCOUNT_ROUTES.MANAGE_MY_ACCOUNT, pathMatch: 'full' },
      { path: MY_ACCOUNT_ROUTES.MANAGE_MY_ACCOUNT, component: MyDetailsComponent },
      { path: MY_ACCOUNT_ROUTES.PAY, component: PaymentComponent },
      { path: MY_ACCOUNT_ROUTES.SUPPORT, component: SupportComponent },
      { path: MY_ACCOUNT_ROUTES.LIST_ALL_BILLS, component: ListAllBillsComponent },
      { path: MY_ACCOUNT_ROUTES.LIST_PAYMENT, component: ListAllPaymentComponent },
    ]
  },
  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class MyAccountRoutingModule { }
