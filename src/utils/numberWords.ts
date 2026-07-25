export function numberToEnglishWords(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'ZERO BAHT';

  const units = [
    '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
    'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
  ];
  const tens = [
    '', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'
  ];

  function convertLessThanThousand(num: number): string {
    if (num === 0) return '';
    if (num < 20) return units[num];
    if (num < 100) {
      return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + units[num % 10] : '');
    }
    return units[Math.floor(num / 100)] + ' HUNDRED' + (num % 100 !== 0 ? ' ' + convertLessThanThousand(num % 100) : '');
  }

  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  let result = '';
  let tempInt = integerPart;

  if (tempInt >= 1000000) {
    const millions = Math.floor(tempInt / 1000000);
    result += convertLessThanThousand(millions) + ' MILLION ';
    tempInt %= 1000000;
  }
  if (tempInt >= 1000) {
    const thousands = Math.floor(tempInt / 1000);
    result += convertLessThanThousand(thousands) + ' THOUSAND ';
    tempInt %= 1000;
  }
  if (tempInt > 0) {
    result += convertLessThanThousand(tempInt);
  }

  result = result.trim() + ' BAHT';

  if (decimalPart > 0) {
    result += ' AND ' + convertLessThanThousand(decimalPart) + ' SATANG';
  } else {
    // Some formats add ONLY or leave it as BAHT
    // e.g. "TWO THOUSAND NINE HUNDRED NINETY SIX BAHT"
  }

  return result.toUpperCase();
}
