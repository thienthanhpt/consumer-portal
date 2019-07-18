import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: 'button[loadingDisable]'
})
export class LoadingDisableDirective implements OnChanges {

  @Input() loadingDisable: boolean;
  @Input() displaySpinner = false;

  constructor(
    private el: ElementRef
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    const { loadingDisable } = changes;
    const el = this.el.nativeElement;

    if (loadingDisable && !loadingDisable.firstChange) {
      el.disabled = loadingDisable.currentValue;
      if (this.displaySpinner) {
        el.innerHTML = loadingDisable.currentValue
          ? `${el.textContent.trim()} <i class="fas fa-spinner fa-spin"></i>`
          : `${el.textContent.trim()}`;
      }
    }
  }
}
