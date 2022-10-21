export function maskSSN(value: any): any {
  return preMask(value);
}

function preMask(value: string): any {
  console.log('premask ' + value);
  let temp = value;
  if (value != null && value != undefined) {
    temp = temp.replace(/\*/g, '');
    console.log('premask temp ' + temp);
    return maskData(value);
  }

  return null;
}

function maskData(event: any): any {
  let maskedSSN: string;
  let maskedSection: any;
  let visibleSection: any;
  let maskedSectionOriginal: string = '';
  let orignalSSN: string;

  console.log('mask ', event);
  if (event.length > 4) {
    let visibleDigitstemp = 4 - event.length;
    let maskedSectiontemp = event.slice(0, -visibleDigitstemp);
    console.log('maskedsection ' + maskedSectiontemp);
    if (maskedSectiontemp)
      maskedSectiontemp = maskedSectiontemp.replace(/\*/g, '');
    // console.log('replace maskedsection ' + maskedSectiontemp);

    if (maskedSectiontemp.length > 0) {
      console.log(
        'maskedSectiontemp > 0   maskedSectionOriginal ' +
          maskedSectionOriginal +
          ' json str ' +
          JSON.parse(JSON.stringify(maskedSectiontemp))
      );
      maskedSectionOriginal =
        maskedSectionOriginal + JSON.parse(JSON.stringify(maskedSectiontemp));
    }
  }

  const visibleDigits = 4;
  maskedSection = event.slice(0, -visibleDigits);

  visibleSection = event.slice(-visibleDigits);
  maskedSSN = maskedSection.replace(/\d/g, '*') + visibleSection;
  orignalSSN = maskedSectionOriginal + visibleSection;
  // console.log(this.maskedSectionOriginal + " visiable ddddddddddddddd " +visibleSection);

  console.log('maskedSSN ' + maskedSSN);
  let ssnObject = {
    orignalSSN: orignalSSN,
    maskedSSN: maskedSSN,
  };
  return ssnObject;
}

export function formatSSN(ssn: string) {
  if (ssn == null || ssn.length == 3 || ssn.length == 6)
    return ssn.replace(/\*/g, '');
  if (ssn?.charAt(ssn?.length - 1) == '-') {
    ssn = ssn.substring(0, ssn.length - 1);
  } else ssn = formatSocialSecurity(ssn);

  return ssn;
}

function formatSocialSecurity(val: string): string {
  val = val.replace(/\D/g, '');
  val = val.replace(/^(\d{3})/, '$1-');
  val = val.replace(/-(\d{2})/, '-$1-');
  val = val.replace(/(\d)-(\d{4}).*/, '$1-$2');
  return val;
}
