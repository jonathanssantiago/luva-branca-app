const DEFAULT_COUNTRY_CODE = '55'

/** Apenas dígitos, sem código do país (55) quando presente no início. */
export function getBrazilPhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length > 11) {
    return digits.slice(2)
  }
  return digits
}

/** Formata para exibição: (11) 99999-9999 — sem prefixo +55. */
export function formatBrazilPhoneDisplay(value: string): string {
  const digits = getBrazilPhoneDigits(value).slice(0, 11)

  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

/** Converte para E.164 (+5511999999999). Aceita DDD+número sem código do país. */
export function normalizePhoneToE164(
  phone: string,
  countryCode: string = DEFAULT_COUNTRY_CODE,
): string {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''

  if (digits.startsWith(countryCode) && digits.length >= countryCode.length + 10) {
    return `+${digits}`
  }

  const local = getBrazilPhoneDigits(phone)
  if (local.length === 10 || local.length === 11) {
    return `+${countryCode}${local}`
  }

  return `+${digits}`
}

export function isValidBrazilPhone(phone: string): boolean {
  const local = getBrazilPhoneDigits(phone)
  return local.length === 10 || local.length === 11
}
