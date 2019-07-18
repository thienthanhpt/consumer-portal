
export * from './types';
export * from './base.service';

export * from './order.service';
export * from './pricing-plan.service';
export * from './util.service';
export * from './billing.service';
export * from './login.service';
export * from './my-account.service';
export * from './login.service';
export * from './transaction.service';
export * from './maintenance-mode.service';

import { OrderService } from './order.service';
import { PricingPlanService } from './pricing-plan.service';
import { UtilService } from './util.service';
import { BillingService } from './billing.service';
import { MyAccountService } from './my-account.service';
import { LoginService } from './login.service';
import { TransactionService } from './transaction.service';
import { MaintenanceModeService } from './maintenance-mode.service';

export const CORE_DATA_SERVICES = [
  OrderService, PricingPlanService, UtilService, BillingService, MyAccountService, LoginService, TransactionService, MaintenanceModeService,
];
