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

/**
 * Convert total amount to English Baht text in uppercase:
 * e.g. 40874.00 -> "FORTY THOUSAND EIGHT HUNDRED AND SEVENTY FOUR BAHT ONLY"
 */
export function numberToEnglishBaht(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'ZERO BAHT ONLY';

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
    const hundreds = units[Math.floor(num / 100)] + ' HUNDRED';
    const remainder = num % 100;
    if (remainder > 0) {
      return hundreds + ' AND ' + convertLessThanThousand(remainder);
    }
    return hundreds;
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
    result += ' AND ' + convertLessThanThousand(decimalPart) + ' SATANG ONLY';
  } else {
    result += ' ONLY';
  }

  return result.toUpperCase().replace(/\s+/g, ' ');
}

export function numberToThaiBaht(num: number): string {
  if (isNaN(num) || num === 0) return 'ศูนย์บาทถ้วน';
  const thaiDigits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const thaiUnits = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  const convertGroup = (nStr: string): string => {
    let res = '';
    const len = nStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(nStr.charAt(i), 10);
      const pos = len - i - 1;
      if (digit !== 0) {
        if (pos === 0 && digit === 1 && len > 1 && parseInt(nStr.charAt(len - 2), 10) !== 0) {
          res += 'เอ็ด';
        } else if (pos === 1 && digit === 1) {
          res += '';
        } else if (pos === 1 && digit === 2) {
          res += 'ยี่';
        } else {
          res += thaiDigits[digit];
        }
        res += thaiUnits[pos];
      }
    }
    return res;
  };

  const fixed = Math.abs(num).toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  let thaiStr = '';

  if (intPart.length > 6) {
    const millionsGroup = intPart.slice(0, -6);
    const remainderGroup = intPart.slice(-6);
    thaiStr += convertGroup(millionsGroup) + 'ล้าน' + convertGroup(remainderGroup);
  } else {
    thaiStr += convertGroup(intPart);
  }

  if (thaiStr === '') thaiStr = 'ศูนย์';
  thaiStr += 'บาท';

  const satangVal = parseInt(decPart, 10);
  if (satangVal === 0) {
    thaiStr += 'ถ้วน';
  } else {
    thaiStr += convertGroup(decPart) + 'สตางค์';
  }

  return (num < 0 ? 'ลบ' : '') + thaiStr;
}
