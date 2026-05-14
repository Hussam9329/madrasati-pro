export const IRAQI_PHONE_REGEX = /^07\d{9}$/;

export function validateIraqiPhone(phone: string): boolean {
  return IRAQI_PHONE_REGEX.test(phone);
}

export function validateQuadrupleName(name: string): boolean {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 4;
}

export function getPhoneErrorMessage(): string {
  return "رقم الهاتف يجب أن يتكون من 11 رقم ويبدأ بـ 07.";
}

export function getQuadrupleNameErrorMessage(): string {
  return "يرجى إدخال الاسم الرباعي كاملًا.";
}
