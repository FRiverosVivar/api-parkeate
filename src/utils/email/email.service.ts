import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  CreateTemplateCommand,
  DeleteTemplateCommand,
  ListTemplatesCommand,
  SendEmailCommand,
  SendTemplatedEmailCommand,
  SESClient,
  SESClientConfig,
  TemplateMetadata
} from "@aws-sdk/client-ses";
import * as lodash from "lodash";
import { EmailTypesEnum } from "./enum/email-types.enum";
import * as path from "path";
import { EmailTypesCode } from "./constants/email-types-code";
import { readFileSync } from "fs";
import { noReplyEmail } from "./constants/no-reply-email";
import { EmailTypesSubjectCode } from "./enum/email-types-subject.enum";

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly SESClient: SESClient;
  constructor(private readonly configService: ConfigService) {
    const SESClientConfig = <SESClientConfig>(
      this.configService.get<SESClientConfig>("uploader.sesConfig")
    );
    this.SESClient = new SESClient(SESClientConfig);
  }
  async onModuleInit() {
    await this.verifyListOfEmailTemplates();
  }
  private getEmailTemplate(emailType: EmailTypesEnum): string | undefined {
    const template = readFileSync(
      path.resolve(
        __dirname + "/templates/" + EmailTypesCode[emailType] + ".template.html"
      ),
      "utf-8"
    );
    return template;
  }
  sendRawEmail(destination: string, content: string, subject: string) {
    return this.SESClient.send(
      new SendEmailCommand({
        Source: noReplyEmail,
        Destination: {
          ToAddresses: [
            destination,
            "francoriverosvivar@gmail.com",
            "dduboish@gmail.com",
            "no-reply@parkeateapp.com",
          ],
        },
        Message: {
          Subject: {
            Data: subject,
          },
          Body: {
            Text: {
              Data: content,
            },
          },
        },
      })
    );
  }
  sendEmail(
    emailType: EmailTypesEnum,
    destination: string,
    properties: string
  ) {
    const destinations = [destination, noReplyEmail];
    if (emailType !== EmailTypesEnum.CODE)
      destinations.push("dduboish@gmail.com");

    const options = {
      Source: noReplyEmail,
      Destination: {
        ToAddresses: destinations,
      },
      Tags: [
        {
          Name: EmailTypesCode[emailType],
          Value: EmailTypesCode[emailType],
        },
      ],
      Template: EmailTypesCode[emailType],
      TemplateData: properties,
    };
    return this.SESClient.send(new SendTemplatedEmailCommand(options));
  }
  publishEmailsToArrayOfDestinations(
    destinations: string[],
    emailType: EmailTypesEnum
  ) {}
  private async verifyListOfEmailTemplates(): Promise<void> {
    const list = await this.SESClient.send(new ListTemplatesCommand({ "MaxItems": 20}));
    const result = this.filterTemplatesAndFindMissingTemplates(
      list.TemplatesMetadata!
    );
    await this.createAWSEMailTemplates(result);
  }
  deleteTemplate(emailType: EmailTypesEnum) {
    return this.SESClient.send(
      new DeleteTemplateCommand({
        TemplateName: EmailTypesCode[emailType],
      })
    );
  }
  private async createAWSEMailTemplates(result: Array<any>) {
    if (!result[EmailTypesEnum.CODE].found)
      await this.createEmailTemplate(EmailTypesEnum.CODE);

    if (!result[EmailTypesEnum.REGISTER].found)
      await this.createEmailTemplate(EmailTypesEnum.REGISTER);

    if (!result[EmailTypesEnum.FORGOTTEN_PASSWORD].found)
      await this.createEmailTemplate(EmailTypesEnum.FORGOTTEN_PASSWORD);

    if (!result[EmailTypesEnum.CHANGE_PASSWORD].found)
      await this.createEmailTemplate(EmailTypesEnum.CHANGE_PASSWORD);

    if (!result[EmailTypesEnum.RESERVATION_CREATED].found)
      await this.createEmailTemplate(EmailTypesEnum.RESERVATION_CREATED);

    if (!result[EmailTypesEnum.LIQUIDATION_GENERATED].found)
      await this.createEmailTemplate(EmailTypesEnum.LIQUIDATION_GENERATED);

    if (!result[EmailTypesEnum.REQUEST_CREATED].found)
      await this.createEmailTemplate(EmailTypesEnum.REQUEST_CREATED);

    if (!result[EmailTypesEnum.REQUEST_PARKING_DETAILS_FORM].found)
      await this.createEmailTemplate(EmailTypesEnum.REQUEST_PARKING_DETAILS_FORM);

    if (!result[EmailTypesEnum.REQUEST_CALENDAR_FORM].found)
      await this.createEmailTemplate(EmailTypesEnum.REQUEST_CALENDAR_FORM);

    if (!result[EmailTypesEnum.REQUEST_FINALIZED].found)
      await this.createEmailTemplate(EmailTypesEnum.REQUEST_FINALIZED);

    if (!result[EmailTypesEnum.REQUEST_CANCELED].found)
      await this.createEmailTemplate(EmailTypesEnum.REQUEST_CANCELED);
  }
  private filterTemplatesAndFindMissingTemplates(
    templates: TemplateMetadata[]
  ) {
    return lodash.map(EmailTypesCode, (codeName) => {
      const found = lodash.some(
        templates,
        (template) => template.Name === codeName
      );
      return { name: codeName, found: found };
    });
  }
  private createEmailTemplate(emailType: EmailTypesEnum) {
    const template = this.getEmailTemplate(emailType);
    this.SESClient.send(
      new CreateTemplateCommand({
        Template: {
          TemplateName: EmailTypesCode[emailType],
          SubjectPart: EmailTypesSubjectCode[emailType],
          TextPart: this.getEmailTemplate(emailType),
          HtmlPart: template ? template : "NO Template found",
        },
      })
    );
  }
}
