import { Observable, Subscriber } from 'rxjs';

/**
 * Read the text contents of a File or Blob using the FileReader interface.
 * This is an async interface so it makes sense to handle it with Rx.
 * @param {blob} File | Blob
 * @return Observable<string>
 */
export const readFile = (blob: File | Blob) => Observable.create((observer: Subscriber<File | Blob>) => {
  if (!(blob instanceof Blob)) {
    observer.error(new Error('`blob` must be an instance of File or Blob.'));
    return;
  }

  const reader = new FileReader();

  reader.onerror = err => observer.error(err);
  reader.onabort = err => observer.error(err);
  reader.onload = () => observer.next(reader.result.split(',')[1]);
  reader.onloadend = () => observer.complete();

  return reader.readAsDataURL(blob);
});
