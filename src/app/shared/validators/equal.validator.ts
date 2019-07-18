// import { Attribute, Directive, forwardRef } from '@angular/core';
// import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';
//
// @Directive({
//   selector: '[appEqualEmail][ngModel]',
//   providers: [
//     { provide : NG_VALIDATORS, useExisting: forwardRef(() => EqualEmail), multi: true }
//   ]
// })
// export class EqualEmail implements Validator {
//   constructor( @Attribute('equalEmail') public equalEmail: string ) {}
//
//   validate(abstractControl: AbstractControl): { [key: string]: any } {
//     const retypedValue = abstractControl.value;
//
//     const originValue = abstractControl.root.get(this.equalEmail);
//
//     if (originValue !== retypedValue) {
//       return { equalEmail: false };
//     } else {
//       return null;
//     }
//   }
// }
