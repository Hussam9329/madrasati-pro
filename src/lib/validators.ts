export const IRAQI_PHONE_REGEX = /^07\d{9}$/;

export function validateIraqiPhone(phone: string): boolean {
  return IRAQI_PHONE_REGEX.test(phone);
}

export function validateFullName(name: string): boolean {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2;
}

// Keep backward compatibility alias
export const validateQuadrupleName = validateFullName;

export function getPhoneErrorMessage(): string {
  return "رقم الهاتف يجب أن يتكون من 11 رقم ويبدأ بـ 07.";
}

export function getQuadrupleNameErrorMessage(): string {
  return "يرجى إدخال الاسم الكامل (الاسم واللقب على الأقل).";
}
