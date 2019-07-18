import { Injectable } from '@angular/core';

import * as _ from 'lodash';

import { BaseModel, BaseService } from './base.service';
import {PricingPlanRateStatus, PRICING_PLAN_RATE_STATUS_OPTIONS, ProductType} from './types';


const PROMOTION_TEMPLATES_FIELD_MAP = {
  startingPeriod: 'starting_period', discountType: 'discount_type', promotionTmpType: 'promotion_tmpl_type',
  lastModifiedDate: 'last_modified_date', promotionFromDate: 'promotion_date_from', createdDate: 'created_date',
  defaultApplyingPeriod: 'default_applying_periods', applyOnPeriod: 'apply_on_period', prefixCode: 'prefix_code',
  isActive: 'is_active', fixedPriceDiscount: 'fixed_price_discount', nameTemplate: 'name', isExpired: 'is_expired',
  id: 'id', promotionToDate: 'promotion_date_to', percentDiscount: 'percent_discount', description: 'description',
  rateWithPromotion: 'rate_with_promotion', rateWithPromotionExcludingTax: 'rate_with_promotion_excluding_tax',
}

export class PromotionTemplate extends BaseModel {
  defaultApplyingPeriod: number = null;
  discountType: string = null;
  percentDiscount: number = null;
  rateWithPromotion: number = null
  rateWithPromotionExcludingTax: number = null;

  protected getFieldMap() {
    return super.getFieldMap(PROMOTION_TEMPLATES_FIELD_MAP);
  }
}

export const PRICING_PLAN_RATE_FIELD_MAP = {
  rate: 'rate', cleanEnergyPercentage: 'clean_energy', offPeakRate: 'off_peak_rate',
  status: 'sales_status', startDate: 'sales_start_date', pricePlanId: 'priceplan_id'
};

export class PricingPlanRate extends BaseModel {

  pricingPlan: PricingPlan = null;
  rate: number = null;
  discountRate: number = null;
  cleanEnergyPercentage: number = null;
  offPeakRate: number = null;
  pricePlanId: number = null;
  status: PricingPlanRateStatus = null;
  startDate: string = null;

  get discountPercentage() {
    return this.discountRate * 100;
  }

  get statusDisplay() {
    return PRICING_PLAN_RATE_STATUS_OPTIONS[_.lowerCase(this.status)] || null;
  }

  protected getFieldMap() {
    return super.getFieldMap(PRICING_PLAN_RATE_FIELD_MAP);
  }
}

const PRICING_PLAN_FIELD_MAP = {
  id: 'id', name: 'pricing_name', displayName: 'web_portal_display_name', subscription: 'subscription', description: 'description',
  companyName: 'company', prefillUrl: 'prefill_url', promotionTemplatesData: 'promotion_templates', createDate: 'created_date',
  currentRateData: 'current_rate', productType: 'product_type', updatedTime: 'last_modified_date', factSheetPDF : 'fact_sheet_pdf',
  factSheetPNG: 'fact_sheet_png',
};

export class PricingPlan extends BaseModel {

  id: number = null;
  name: string = null;
  displayName: string = null;
  subscription: string = null;
  description: string = null;
  companyName: string = null;
  prefillUrl: string = null;
  pricingPlanRates: PricingPlanRate[] = [];
  promotionTemplates: PromotionTemplate[] = [];
  currentRate: PricingPlanRate = null;
  productType: ProductType = null;
  factSheetPDF: string = null;
  factSheetPNG: string = null;

  set promotionTemplatesData(dataArray: object[]) {
    if (!_.isEmpty(dataArray)) {
      this.promotionTemplates = _.map(dataArray, data => new PromotionTemplate().fromData(data));
    }
  }

  set currentRateData(data: object) {
    this.currentRate = new PricingPlanRate().fromData(data);
  }

  protected getFieldMap() {
    return super.getFieldMap(PRICING_PLAN_FIELD_MAP);
  }
}

@Injectable()
export class PricingPlanService extends BaseService<PricingPlan> {

  protected baseUrl = 'catalogue';

  protected newModel = (data: object) => new PricingPlan().fromData(data);

  protected getFieldMap() {
    return super.getFieldMap(PRICING_PLAN_FIELD_MAP);
  }
}
