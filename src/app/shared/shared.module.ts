import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'ngx-bootstrap';

import { SHARED_DIRECTIVES } from './directives';
import { SHARED_PIPES } from './pipes';
import { SHARED_VALIDATORS } from './validators';


@NgModule({
  imports: [ CommonModule, TooltipModule.forRoot() ],
  declarations: [ SHARED_DIRECTIVES, SHARED_VALIDATORS, SHARED_PIPES ],
  exports: [ CommonModule, FormsModule, SHARED_DIRECTIVES, SHARED_VALIDATORS, SHARED_PIPES ]
})
export class SharedModule { }
