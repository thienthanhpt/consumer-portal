import { Component, Host } from '@angular/core';

import { LocalStorage } from '@ngx-pwa/local-storage';
import * as _ from 'lodash';

import { GoogleTagManagerService, UtilService } from '@app/core';
import { readFile } from '@app/shared';
import { OrderComponent } from '../order.component';
import { ORDER_GA_EVENT_NAMES, STORAGE_KEYS } from '../order.constant';

enum ErrorCode {
  TokenFail = 'E_TOKEN_FAIL',
}

export enum DocumentName {
  IdentificationFront = 'Identification Document - Front',
  IdentificationBack = 'Identification Document - Back',
  SpPastMonthBill = 'SP Past Month Bill',
  NewSpAccountOpeningLetter = 'New SP Account Opening Letter',
  LetterOfAuthorisation = 'Letter of Authorisation by SP Account Holder',
  ProofOfResidency = 'Proof of Residency',
  IdentificationSpAccountHolderFront = 'Identification Document - SP Account Holder - Front',
  IdentificationSpAccountHolderBack = 'Identification Document - SP Account Holder - Back',
  IdentificationApplicantFront = 'Identification Document - Applicant - Front',
  IdentificationApplicantBack = 'Identification Document - Applicant - Back',
}

interface UploadDocument { name: DocumentName; file: File; fileName: string; uploadedId?: number; }

const SP_ACCOUNT_DOCUMENT_NAMES = [
  DocumentName.IdentificationFront, DocumentName.IdentificationBack, DocumentName.SpPastMonthBill, DocumentName.NewSpAccountOpeningLetter
];

const NON_SP_ACCOUNT_DOCUMENT_NAMES = [
  DocumentName.LetterOfAuthorisation, DocumentName.ProofOfResidency, DocumentName.IdentificationSpAccountHolderFront,
  DocumentName.IdentificationSpAccountHolderBack, DocumentName.IdentificationApplicantFront, DocumentName.IdentificationApplicantBack,
];

@Component({
  selector: 'app-documents-upload',
  templateUrl: './documents-upload.component.html',
})
export class DocumentsUploadComponent {

  DocumentName = DocumentName;

  documents: { [name: string]: UploadDocument } = {};

  constructor(
    @Host() public parent: OrderComponent,
    private utilService: UtilService,
    private localStorage: LocalStorage,
    private gtagService: GoogleTagManagerService,
  ) {
    // Don't display step section 1, 2, 3 -> not display padding
    const element = document.getElementById('step-section');
    element.classList.remove('pt-3');
  }

  onSubmit(form) {
    if (form.valid) {
      this.parent.model.documentIds = _.chain(this.documents)
        .pick(this.parent.isSPAccountHolder ? SP_ACCOUNT_DOCUMENT_NAMES : NON_SP_ACCOUNT_DOCUMENT_NAMES)
        .values().map('uploadedId')
        .value();
      this.localStorage.setItem(STORAGE_KEYS.UPLOADED_DOCUMENT, this.documents).subscribe();
      this.gtagService.sendEvent(ORDER_GA_EVENT_NAMES.UPLOAD_DOCUMENT);
      this.parent.saveAndNext();
    }
  }

  selectFile(event) {
    const document = event.document;
    if (document && document.name) {
      this.documents[document.name] = document;
      const documentName = document.name + '.' + document.file.name.split('.').pop();
      readFile(document.file).subscribe(
        content => this.utilService.uploadDocument(content, documentName, this.parent.token).subscribe(
          uploadedDocument => {
            this.documents[document.name].uploadedId = uploadedDocument.id;
            this.documents[document.name].file = null;
          },
          rs => {
            if (_.get(rs, 'error.code') === ErrorCode.TokenFail) {
              this.parent.token = null;
              this.parent.openErrorModal('Errors',
                'Your session was expired. Please go back to previous page and verify your mobile again.');
            } else {
              this.parent.openErrorModal('Errors', _.get(rs, 'error.message'));
            }
          }
        )
      );
    }
  }

  cancelUpload(event) {
    delete this.documents[event.documentName];
  }
}
