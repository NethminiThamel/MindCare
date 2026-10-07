const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string, required = true): string | undefined {
  const email = value.trim();
  if (!email) return required ? 'Email address is required.' : undefined;
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address.';
  return undefined;
}

export function validatePhone(value: string, required = true): string | undefined {
  const phone = value.trim();
  if (!phone) return required ? 'Phone number is required.' : undefined;
  if (!/^\d+$/.test(phone)) return 'Use numbers only.';
  if (phone.length !== 10) return 'Enter exactly 10 digits.';
  return undefined;
}

export function validateRequiredName(value: string): string | undefined {
  return value.trim() ? undefined : 'Contact name is required.';
}
