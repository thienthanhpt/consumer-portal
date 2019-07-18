import {Attribute, Directive, ElementRef, forwardRef, Input} from '@angular/core';
import { NG_VALIDATORS, Validator} from '@angular/forms';
import * as _ from 'lodash';

@Directive({
  selector: '[ngModel][appMaxFileSize]',
  providers: [
    { provide : NG_VALIDATORS, useExisting: forwardRef(() => MaxFileSizeValidator), multi: true }
  ]
})
export class MaxFileSizeValidator implements Validator {
  @Input('limit') limit: number;
  constructor(private elRef: ElementRef) {
  }

  validate(): { [key: string]: any } {
    const size = _.get(this.elRef.nativeElement.files[0], 'size');
    if (size > this.limit) {
      return {'fileMaxSize': true};
    }
    return {'fileMaxSize': false};
  }
}
