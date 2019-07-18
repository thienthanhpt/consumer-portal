import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatTableModule, MatSortModule, MatPaginatorIntl, MatCardModule, MatProgressSpinnerModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule} from '@angular/material/paginator';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { RECAPTCHA_SETTINGS, RecaptchaModule, RecaptchaSettings } from 'ng-recaptcha';

import { MyAccountRoutingModule } from './my-account-routing.module';
import { CoreModule } from '@app/core';
import { AuthGuard } from '@app/core/guards/auth.guard';
import { SharedModule } from '@app/shared';
import { MyAccountComponent } from './my-account.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { environment } from '@env/environment';
import { AUTH_COMPONENTS } from './auth';
import { ACCOUNT_COMPONENTS } from './account';
import { CustomPaginatorService } from './account/my-consumption/services/custom-paginator.service';

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    MyAccountRoutingModule,
    CoreModule,
    BrowserAnimationsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatCardModule,
    MatProgressSpinnerModule,
    PdfViewerModule,
    FormsModule,
    RecaptchaModule.forRoot(),
    ReactiveFormsModule,
    SharedModule,
  ],
  declarations: [
    MyAccountComponent,
    PageNotFoundComponent,
    AUTH_COMPONENTS,
    ACCOUNT_COMPONENTS,
  ],
  providers: [
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: { siteKey: environment.reCaptchaSiteKey, size: 'invisible' } as RecaptchaSettings,
    },
    { provide: MatPaginatorIntl, useClass: CustomPaginatorService },
    AuthGuard
  ],
  bootstrap: [ MyAccountComponent ]
})
export class MyAccountModule {
  constructor() {
    console.log('Environment config', environment);
  }
}
