import { Injectable } from '@angular/core';

@Injectable()
export class LoaderService {
  private isLoading = true;

  loading() {
    this.isLoading = true;
  }

  done() {
    this.isLoading = false;
  }

  status() {
    return this.isLoading;
  }
}
