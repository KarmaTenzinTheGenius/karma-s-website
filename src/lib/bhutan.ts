export const DZONGKHAGS = [
  'Bumthang',
  'Chhukha',
  'Dagana',
  'Gasa',
  'Haa',
  'Lhuentse',
  'Mongar',
  'Paro',
  'Pema Gatshel',
  'Punakha',
  'Samdrup Jongkhar',
  'Samtse',
  'Sarpang',
  'Thimphu',
  'Trashigang',
  'Trashi Yangtse',
  'Trongsa',
  'Tsirang',
  'Wangdue Phodrang',
  'Zhemgang',
] as const;

export type Dzongkhag = (typeof DZONGKHAGS)[number];

/** Bhutanese postal codes are 5 digits. */
export const POSTAL_CODE_PATTERN = /^\d{5}$/;

export const POSTAL_CODE_HINT = '5-digit Bhutan Post code';
