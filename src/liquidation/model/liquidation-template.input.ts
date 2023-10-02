
export interface MinifiedBookingForPDF {
    numberId: string,
    dateStart: string,
    dateEnd: string,
    bookingType: string,
    finalPrice: string
}
export interface LiquidationPDFTemplate {
    liquidation: {
        numberId: string,
        totalAmount: string,
        parkeateTax: string,
        ivaTax: string,
        totalAmountToPay: string,
        dateLiquidationGenerated: string,
    },
    client: {
        rut: string,
        fullName: string,
    }
    bookings: MinifiedBookingForPDF[],
    bank: {
        accountName: string,
        bankTypeName: string,
        accountTypeName: string,
        accountNumber: string,
        accountEmail: string,
    }
}