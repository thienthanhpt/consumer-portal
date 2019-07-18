export const AppConfig = {
  dateTimeFormat: {
    dateShort: 'DD/MM/YYYY',
    dateApi: 'YYYY-MM-DD',
    dateTimeShort: 'DD/MM/YYYY HH:mm:ss',
    dateTimeApi: 'YYYY-MM-DD[T]HH:mm:ss[Z]',
    completeDateTimeISOFormat: 'YYYY-MM-DD HH:mm:ss',
  },
  bootstrap: {
    datePicker: {
      dateInputFormat: 'DD/MM/YYYY',
      containerClass: 'theme-green'
    }
  },
  validationRegex: {
    spAccountNo: '^([\\d]{9})([\\d-])$',
    mobileNo: '^([\\d])*$',
    email: '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\' +
      '.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$',
    nricNo: '^([a-zA-Z0-9]{9})$',
    postalCode: '^([\\d]{6})$',
    blockHouseNo: '.*\\d.*',
    password: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d.*)(?=.*\\W.*)[a-zA-Z0-9\\d\\W\\S].{11,127}$',
    payAmount: '^\\s*(?=.*[1-9])\\d*(?:\\.\\d{1,2})?\\s*$'
  }
};
