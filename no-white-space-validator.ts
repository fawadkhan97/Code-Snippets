import { FormControl } from '@angular/forms';

export function NoWhitespaceValidator(control: FormControl) {
  if (control.value == '') return;
  const isWhitespace =
    ((control && control.value && control.value.toString()) || '').trim()
      .length === 0;
  return isWhitespace ? { whitespace: true } : null;
}
