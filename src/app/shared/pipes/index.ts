import { BooleansPipe, DayPipe, PercentagePipe, SwitchPipe } from './display.pipe';
import { ValuesPipe, ToArrayPipe } from './object.pipe';
import { IncludesPipe } from './array.pipe';


export const SHARED_PIPES = [
  BooleansPipe, DayPipe, PercentagePipe, SwitchPipe,
  ValuesPipe, ToArrayPipe,
  IncludesPipe,
];
