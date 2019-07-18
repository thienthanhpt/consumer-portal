import { Pipe, PipeTransform } from '@angular/core';

import * as _ from 'lodash';


@Pipe({ name: 'includes' })
export class IncludesPipe implements PipeTransform {
  transform = (array: Array<string | number>, value: string | number): boolean => _.includes(array, value);
}
