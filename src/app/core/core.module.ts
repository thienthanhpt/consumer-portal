import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { ModalModule } from 'ngx-bootstrap';

import { RequestInterceptor } from './interceptors/request.interceptor';
import { CORE_DATA_SERVICES } from './data-services';
import { CORE_SERVICES } from './services';


@NgModule({
  imports: [
    CommonModule, HttpClientModule, ModalModule.forRoot()
  ],
  declarations: [],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: RequestInterceptor, multi: true },
    CORE_DATA_SERVICES, CORE_SERVICES
  ]
})
export class CoreModule {
  constructor(
    @Optional() @SkipSelf() parentModule: CoreModule
  ) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import only in AppModule');
    }
  }
}
