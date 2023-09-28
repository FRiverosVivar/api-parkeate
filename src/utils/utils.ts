import * as lodash from 'lodash';
import { readFileSync } from "fs";
import { Kind } from "graphql";
import { LiquidationPDFTemplate, MinifiedBookingForPDF } from 'src/liquidation/model/liquidation-template.input';
import * as path from 'path';
import * as handlebars from 'handlebars'
import { DateTime } from 'luxon';
import * as puppeteer from 'puppeteer'
import { LiquidationEntity } from 'src/liquidation/entity/liquidation.entity';
import { ClientEntity } from 'src/client/entity/client.entity';
import { IVA_TAX, PARKEATE_TAX } from 'src/liquidation/model/parkeate.const';
import { BankAccountTypeNameEnum, BankNames } from 'src/client/model/bank.enum';
import { BookingEntity } from 'src/booking/entity/booking.entity';
import { BookingTypeNameEnum } from 'src/booking/enum/booking-types.enum';

export type PasswordGeneratorOptions = {
  length: number;
  ambiguous: boolean;
  uppercase: boolean;
  minUppercase: number;
  lowercase: boolean;
  minLowercase: number;
  number: boolean;
  minNumber: number;
  special?: boolean;
  minSpecial: number;
  numWords?: number;
  wordSeparator?: string;
  capitalize?: boolean;
  includeNumber?: boolean;
  type?: "password" | "passphrase";
};

export function getCodeForRegister(): number {
  return lodash.random(1000, 9999);
}

export function parseLiteral(ast: any): unknown {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT: {
      const value = Object.create(null);
      ast.fields.forEach((field: any) => {
        value[field.name.value] = parseLiteral(field.value);
      });
      return value;
    }
    case Kind.LIST:
      return ast.values.map(parseLiteral);
    default:
      return null;
  }
}
export async function readPdfTemplateFromFilesAndCompileWithData(data: LiquidationPDFTemplate) {
	let templateHtml = readFileSync(path.resolve(__dirname + '/liquidation/liquidation.template.html'));
  let template = handlebars.compile(templateHtml.toString());
  let html = template(data)
  const dateTime = DateTime.now()
  const date = dateTime.toFormat('yyyy-MM-dd')
  const pdfPath = path.join('', `${data.client.rut}-${date}.pdf`);
  const options = {
		margin: {
			top: "10px",
			bottom: "30px"
		},
		printBackground: true,
		path: pdfPath
	}
  const browser = await puppeteer.launch({
		args: ['--no-sandbox'],
		headless: 'new',
    
	});

	const page = await browser.newPage();
  await page.goto(`data:text/html;charset=UTF-8,${html}`, {
		waitUntil: 'networkidle0'
	});
  await page.setContent(html)
	const pdfBuffer = await page.pdf(options);
	await browser.close();
  return pdfBuffer
}
export function generateLiquidationTemplateDataToFulfillPdfTemplate(liquidation: LiquidationEntity, client: ClientEntity): LiquidationPDFTemplate {
  const data: LiquidationPDFTemplate = {
    liquidation: {
      numberId: liquidation.numberId,
      totalAmount: formatearMonedaChilena(liquidation.priceToBeLiquidated),
      parkeateTax: getParkeateTaxFromAmount(liquidation.priceToBeLiquidated),
      ivaTax: getIvaFromAmount(liquidation.priceToBeLiquidated),
      totalAmountToPay: getPriceAfterTaxes(liquidation.priceToBeLiquidated),
      dateLiquidationGenerated: DateTime.now().toISO()!,
    },
    client: {
      rut: client.rut,
      fullName: client.fullname
    },
    bookings: mapBookingsToPDFTemplateBookings(liquidation.bookings),
    bank: {
      accountName: client.bankAccountName,
      bankTypeName: BankNames[client.bankType],
      accountTypeName: BankAccountTypeNameEnum[client.bankAccountType],
      accountNumber: client.bankAccountNumber,
      accountEmail: client.bankAccountEmail
    }
  }
  return data;
}
export function formatearMonedaChilena(amount: number) {
  // Convierte el número a un string y divide la parte entera de la decimal
  const partes = amount.toFixed(0).toString().split('.');
  
  // Formatea la parte entera con puntos como separadores de miles
  const parteEnteraFormateada = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  // Retorna el resultado con el símbolo de la moneda chilena
  return `$${parteEnteraFormateada}`;
}
export function getParkeateTaxFromAmount(amount: number) {
  const tax = Math.round(amount * PARKEATE_TAX)
  return formatearMonedaChilena(tax)
}
export function getIvaFromAmount(amount: number) {
  const tax = Math.round(amount * IVA_TAX)
  return formatearMonedaChilena(tax)
}
export function getPriceAfterTaxes(amount: number) {
  const parkeateTax = Math.round(amount * PARKEATE_TAX)
  const ivaTax = Math.round(amount * IVA_TAX)
  const finalPrice = Math.round((amount - parkeateTax) - ivaTax)
  return formatearMonedaChilena(finalPrice)
}
export function mapBookingsToPDFTemplateBookings(bookings: BookingEntity[]): MinifiedBookingForPDF[] {
  let minifiedBookings: MinifiedBookingForPDF[] = []
  bookings.forEach((b) => {
    const minifiedBooking = mapBookingToMinifiedBookingForPDFTemplate(b)
    minifiedBookings.push(minifiedBooking)
  })
  return minifiedBookings
}
const DefaultOptions: PasswordGeneratorOptions = {
  length: 14,
  ambiguous: false,
  number: true,
  minNumber: 1,
  uppercase: true,
  minUppercase: 0,
  lowercase: true,
  minLowercase: 0,
  special: false,
  minSpecial: 1,
  type: "password",
  numWords: 3,
  wordSeparator: "-",
  capitalize: false,
  includeNumber: false,
};
export function mapBookingToMinifiedBookingForPDFTemplate(booking: BookingEntity): MinifiedBookingForPDF {
  const minifiedBooking: MinifiedBookingForPDF = {
    numberId: booking.numberId,
    dateStart: DateTime.fromJSDate(booking.dateStart).toFormat('yyyy MM dd hh:mm:ss'),
    dateEnd: DateTime.fromJSDate(booking.dateExtended ? booking.dateExtended: booking.dateEnd).toFormat('yyyy MM dd hh:mm:ss'),
    bookingType: BookingTypeNameEnum[booking.bookingType],
    finalPrice: formatearMonedaChilena(booking.finalPrice)
  }
  return minifiedBooking
}
export async function generatePassword(options: PasswordGeneratorOptions): Promise<string> {
  // overload defaults with given options
  const o = Object.assign({}, DefaultOptions, options)!

  if (o.type === "passphrase") {
    return this.generatePassphrase(options);
  }

  // sanitize
  this.sanitizePasswordLength(o, true);

  const minLength: number = o.minUppercase + o.minLowercase + o.minNumber + o.minSpecial;
  if (o.length < minLength) {
    o.length = minLength;
  }

  const positions: string[] = [];
  if (o.lowercase && o.minLowercase > 0) {
    for (let i = 0; i < o.minLowercase; i++) {
      positions.push("l");
    }
  }
  if (o.uppercase && o.minUppercase > 0) {
    for (let i = 0; i < o.minUppercase; i++) {
      positions.push("u");
    }
  }
  if (o.number && o.minNumber > 0) {
    for (let i = 0; i < o.minNumber; i++) {
      positions.push("n");
    }
  }
  if (o.special && o.minSpecial > 0) {
    for (let i = 0; i < o.minSpecial; i++) {
      positions.push("s");
    }
  }
  while (positions.length < o.length) {
    positions.push("a");
  }

  // shuffle
  await this.shuffleArray(positions);

  // build out the char sets
  let allCharSet = "";

  let lowercaseCharSet = "abcdefghijkmnopqrstuvwxyz";
  if (o.ambiguous) {
    lowercaseCharSet += "l";
  }
  if (o.lowercase) {
    allCharSet += lowercaseCharSet;
  }

  let uppercaseCharSet = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  if (o.ambiguous) {
    uppercaseCharSet += "IO";
  }
  if (o.uppercase) {
    allCharSet += uppercaseCharSet;
  }

  let numberCharSet = "23456789";
  if (o.ambiguous) {
    numberCharSet += "01";
  }
  if (o.number) {
    allCharSet += numberCharSet;
  }

  const specialCharSet = "!@#$%^&*";
  if (o.special) {
    allCharSet += specialCharSet;
  }

  let password = "";
  for (let i = 0; i < o.length; i++) {
    let positionChars: string = ''
    switch (positions[i]) {
      case "l":
        positionChars = lowercaseCharSet;
        break;
      case "u":
        positionChars = uppercaseCharSet;
        break;
      case "n":
        positionChars = numberCharSet;
        break;
      case "s":
        positionChars = specialCharSet;
        break;
      case "a":
        positionChars = allCharSet;
        break;
      default:
        break;
    }

    const randomCharIndex = await this.cryptoService.randomNumber(0, positionChars.length - 1);
    password += positionChars.charAt(randomCharIndex);
  }

  return password;
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function appendRandomNumberToRandomWord(wordList: string[]) {
  if (wordList == null || wordList.length <= 0) {
    return;
  }
  const index = await this.cryptoService.randomNumber(0, wordList.length - 1);
  const num = await this.cryptoService.randomNumber(0, 9);
  wordList[index] = wordList[index] + num;
}
export async function shuffleArray(array: string[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = await this.cryptoService.randomNumber(0, i);
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function sanitizePasswordLength(options: any, forGeneration: boolean) {
  let minUppercaseCalc = 0;
  let minLowercaseCalc = 0;
  let minNumberCalc: number = options.minNumber;
  let minSpecialCalc: number = options.minSpecial;

  if (options.uppercase && options.minUppercase <= 0) {
    minUppercaseCalc = 1;
  } else if (!options.uppercase) {
    minUppercaseCalc = 0;
  }

  if (options.lowercase && options.minLowercase <= 0) {
    minLowercaseCalc = 1;
  } else if (!options.lowercase) {
    minLowercaseCalc = 0;
  }

  if (options.number && options.minNumber <= 0) {
    minNumberCalc = 1;
  } else if (!options.number) {
    minNumberCalc = 0;
  }

  if (options.special && options.minSpecial <= 0) {
    minSpecialCalc = 1;
  } else if (!options.special) {
    minSpecialCalc = 0;
  }

  // This should never happen but is a final safety net
  if (!options.length || options.length < 1) {
    options.length = 10;
  }

  const minLength: number = minUppercaseCalc + minLowercaseCalc + minNumberCalc + minSpecialCalc;
  // Normalize and Generation both require this modification
  if (options.length < minLength) {
    options.length = minLength;
  }

  // Apply other changes if the options object passed in is for generation
  if (forGeneration) {
    options.minUppercase = minUppercaseCalc;
    options.minLowercase = minLowercaseCalc;
    options.minNumber = minNumberCalc;
    options.minSpecial = minSpecialCalc;
  }
}