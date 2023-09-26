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
      accountNumber: client.bankAccountNumber
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