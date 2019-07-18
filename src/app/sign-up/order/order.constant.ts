export const STORAGE_KEYS = {
  ORDER: 'signUpOrder',
  CURRENT_STEP_INDEX: 'currentStepIndex',
  PRICING_PLAN: 'orderPricingPlan',
  UPLOADED_DOCUMENT: 'orderDocuments',
  SERVICE_ADDRESS: 'orderServiceAddress',
  VERIFYING_OTP_COUNT: 'verifyingOTPCount',
  IS_SP_ACCOUNT_HOLDER: 'isSPAccountHolder',
  REFERRAL_CODE: 'referralCode',
  REBATE_AMOUNT: 'rebateAmount'
};

export const ORDER_ROUTES = {
  PLAN_DETAIL: '',
  PERSONAL_PARTICULAR: 'enter-your-details',
  SERVICE_ADDRESS: 'enter-your-address',
  PAYMENT_MODE: 'payment-mode',
  DOCUMENTS_UPLOAD: 'upload-documents',
  EMA_FACT_SHEET: 'review-fact-sheet',
  ORDER_REVIEW: 'review-order',
  ORDER_CONFIRMATION: 'confirmation',
};

export const ORDER_GA_EVENT_NAMES = {
  OPEN_SIGN_UP: 'open_signup',
  ACK_ADVISORY: 'ack_advisory',
  REFERRAL_CODE: 'referral_code',
  ENTER_YOUR_DETAIL_1: 'enter_your_details_1',
  ENTER_YOUR_DETAIL_2: 'enter_your_details_2',
  ENTER_YOUR_DETAIL_3: 'enter_your_details_3',
  SELECT_HDB1: 'hdb1',
  SELECT_HDB3: 'hdb3',
  SELECT_HDB4: 'hdb4',
  SELECT_HDB5: 'hdb5',
  SELECT_CONDO: 'condo',
  SELECT_TERRACE: 'terrace',
  SELECT_SEMI: 'semi',
  SELECT_BUNGALOW: 'bungalow',
  UPLOAD_DOCUMENT: 'upload_document',
  ACK_FACTSHEET: 'ack_factsheet',
  ACK_TERM_AND_CONDITION: 'ack_t&c',
  REVIEW_ORDER_1: 'review_order_1',
  REVIEW_ORDER_2: 'review_order_2',
};
