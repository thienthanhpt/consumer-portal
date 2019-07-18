import { Component, DoCheck, EventEmitter, forwardRef, Input, KeyValueDiffer, KeyValueDiffers, Output } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';

import { DocumentName } from './documents-upload.component';

export const DOCUMENT_UPLOAD_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => DocumentUploadInputComponent),
  multi: true
};

export const DOCUMENT_UPLOAD_VALIDATOR: any = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => DocumentUploadInputComponent),
  multi: true
};

@Component({
  selector: 'app-document-upload-input',
  templateUrl: './document-upload-input.component.html',
  providers: [DOCUMENT_UPLOAD_VALUE_ACCESSOR, DOCUMENT_UPLOAD_VALIDATOR]
})
export class DocumentUploadInputComponent implements DoCheck, ControlValueAccessor, Validator {
  document: { name: DocumentName, file: File, fileName: string, uploadedId?: number };
  @Input() documentName: DocumentName;
  @Input() isSubmitted: boolean;
  @Input() placeHolder: string;
  @Input() required: boolean;

  @Output() selectFile: EventEmitter<any> = new EventEmitter();
  @Output() upload: EventEmitter<any> = new EventEmitter();
  @Output() cancel: EventEmitter<any> = new EventEmitter();

  private onValidatorChange: () => void;
  private documentDiffer: KeyValueDiffer<string, any>;

  constructor(
    private differs: KeyValueDiffers
  ) { }

  onSelectFile(file: File, name: DocumentName) {
    if (file) {
      this.document = { name: name, file: file, fileName: file.name, uploadedId: null };
      this.selectFile.emit({ document: this.document });
    }
  }

  ngDoCheck() {
    if (this.documentDiffer && this.required) {
      const changes = this.documentDiffer.diff(this.document);
      if (changes && this.onValidatorChange) {
        this.onValidatorChange();
      }
    }
  }

  cancelUpload(name: DocumentName) {
    this.cancel.emit({ documentName: name });
  }

  registerOnChange(fn: any): void {
  }

  registerOnTouched(fn: any): void {
  }

  setDisabledState(isDisabled: boolean): void {
  }

  writeValue(value: { name: DocumentName, file: File, fileName: string, uploadedId?: number }): void {
    this.document = value;
    this.documentDiffer = (value && this.required) ? this.differs.find(this.document).create() : null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  validate(c: AbstractControl): ValidationErrors | null {
    return !this.required || (!!this.document && !!this.document.uploadedId) ? null : { message: 'Upload document is required' };
  }

}

