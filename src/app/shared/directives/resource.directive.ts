import { Directive, ElementRef, HostBinding, Input } from '@angular/core';

import { environment } from '@env/base';

@Directive({
  selector: 'img[includeCurrentTimestamp]'
})
export class ImageIncludeCurrentTimestampDirective {
  @HostBinding('src') src: string;
  @Input('src') set changeImageSrc(url: string) {
    this.src = url + '?t=' + new Date().getTime();
  }
}

@Directive({
  selector: 'a[includeCurrentTimestamp]'
})
export class ResourceIncludeCurrentTimestampDirective {
  @HostBinding('href') href: string;
  @Input('href') set changeAnchorLink(url: string) {
    this.href = url + '?t=' + new Date().getTime();
  }
}

@Directive({
  selector: 'img[includeVersion]'
})
export class ImageIncludeVersionDirective {
  constructor(private el: ElementRef) {
    el.nativeElement.src += '?ver=' + environment.version;
  }
  @HostBinding('src') src: string;
  @Input('src') set changeImageSrc(url: string) {
    this.src = url + '?ver=' + environment.version;
  }
}

@Directive({
  selector: 'a[includeVersion]'
})
export class ResourceIncludeVersionDirective {
  @HostBinding('href') href: string;
  @Input('href') set changeAnchorLink(url: string) {
    this.href = url + '?ver=' + environment.version;
  }
}
