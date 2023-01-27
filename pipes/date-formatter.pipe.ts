import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormatter',
})
export class DateFormatterPipe implements PipeTransform {
  transform(value: String, ...args: unknown[]): unknown {
    return value?.trim().replace(/-/g, '/');
  }
}
