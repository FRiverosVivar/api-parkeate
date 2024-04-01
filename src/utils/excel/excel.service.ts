import { Injectable } from "@nestjs/common";
import { Workbook } from "exceljs";
import { DateTime } from "luxon";
import * as _ from "lodash";
@Injectable()
export class ExcelService {
  constructor() {}
  async createExcelFromDataArray(data: Array<any>, columns: Array<any>) {
    const workbook = new Workbook();
    const time = DateTime.now().toFormat("hh.mm.ss-ddMMyyyy");
    const worksheet = workbook.addWorksheet(time);
    worksheet.columns = columns;
    _.forEach(data, (v) => {
      worksheet.addRow(v);
    });
    return await workbook.xlsx.writeBuffer();
  }
}
