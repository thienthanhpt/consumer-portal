import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'booleans' })
export class BooleansPipe implements PipeTransform {
  transform = (value: boolean): string => (value === true) ? 'Yes' : 'No';
}

@Pipe({ name: 'percentage' })
export class PercentagePipe implements PipeTransform {
  transform(value: string | number, showPercent: boolean = true): string {
    let valueNumber = Number(value);
    if (isNaN(valueNumber)) valueNumber = 0;
    return (valueNumber * 100).toFixed(2) + (showPercent ? '%' : '');
  }
}

@Pipe({ name: 'switch' })
export class SwitchPipe implements PipeTransform {
  transform = (switchObject: { [key: string]: any}, key: string): any => switchObject[key];
}

@Pipe({ name: 'day' })
export class DayPipe implements PipeTransform {
  transform(value: number): string {
    return value + ' day' + ( value > 1 ? 's' : '');
  }
}
