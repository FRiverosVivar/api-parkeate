import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateTemplateCommand,
  DeleteTemplateCommand,
  ListTemplatesCommand,
  SendTemplatedEmailCommand,
  SESClient,
  SESClientConfig,
  TemplateMetadata,
} from '@aws-sdk/client-ses';
import * as lodash from 'lodash';
import { EmailTypesEnum } from './enum/email-types.enum';
import * as path from 'path';
import { NoEmailTemplatesException } from '../exceptions/no-email-templates.exception';
import { EmailTypesCode } from './constants/email-types-code';
import { readFileSync } from 'fs';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly SESClient: SESClient;
  constructor(private readonly configService: ConfigService) {
    const SESClientConfig = <SESClientConfig>(
      this.configService.get<SESClientConfig>('uploader.sesConfig')
    );
    this.SESClient = new SESClient(SESClientConfig);
  }
  async onModuleInit() {
    await this.deleteTemplate(EmailTypesEnum.CODE);
    await this.verifyListOfEmailTemplates();
  }
  private getEmailTemplate(emailType: EmailTypesEnum): string | undefined {
    const template = readFileSync(
      path.resolve(
        __dirname +
          '\/templates\/' +
          EmailTypesCode[emailType] +
          '.template.html',
      ),
      'utf-8',
    );
    return template;
  }
  sendEmail(
    emailType: EmailTypesEnum,
    destination: string,
    properties: string,
  ) {
    return this.SESClient.send(
      new SendTemplatedEmailCommand({
        // SendTemplatedEmailRequest
        Source: 'francoriverosvivar@gmail.com',
        Destination: {
          ToAddresses: [destination],
        },
        Tags: [
          {
            Name: 'Prueba',
            Value: 'Test',
          },
        ],
        Template: EmailTypesCode[emailType],
        TemplateData: properties,
      }),
    );
  }
  publishEmailsToArrayOfDestinations(destinations: string[], emailType: EmailTypesEnum) {

  }
  private async verifyListOfEmailTemplates(): Promise<void> {
    const list = await this.SESClient.send(new ListTemplatesCommand({}));
    if (!list || !list.TemplatesMetadata) {
      throw new NoEmailTemplatesException();
    }
    const result = this.filterTemplatesAndFindMissingTemplates(
      list.TemplatesMetadata,
    );
    await this.createAWSEMailTemplates(result);
  }
  deleteTemplate(emailType: EmailTypesEnum) {
    return this.SESClient.send(
      new DeleteTemplateCommand({
        TemplateName: EmailTypesCode[emailType],
      }),
    );
  }
  private async createAWSEMailTemplates(result: Array<any>) {
    if (!result[EmailTypesEnum.CODE].found)
      await this.createCodeEmailTemplate();
    if (!result[EmailTypesEnum.REGISTER].found)
      await this.createRegisterEmailTemplate();
    if (!result[EmailTypesEnum.FORGOTTEN_PASSWORD].found)
      await this.createForgottenPasswordEmailTemplate();
    if (!result[EmailTypesEnum.CHANGE_PASSWORD].found)
      await this.createChangePasswordEmailTemplate();
    if (!result[EmailTypesEnum.RESERVATION_CREATED].found)
      await this.createReservationCreatedEmailTemplate();
  }
  private filterTemplatesAndFindMissingTemplates(
    templates: TemplateMetadata[],
  ) {
    return lodash.map(EmailTypesCode, (codeName) => {
      const found = lodash.some(
        templates,
        (template) => template.Name === codeName,
      );
      return { name: codeName, found: found };
    });
  }
  private createCodeEmailTemplate() {
    const template = this.getEmailTemplate(EmailTypesEnum.CODE);
    this.SESClient.send(
      new CreateTemplateCommand({
        Template: {
          TemplateName: EmailTypesCode[EmailTypesEnum.CODE],
          SubjectPart: EmailTypesCode[EmailTypesEnum.CODE],
          TextPart: this.getEmailTemplate(EmailTypesEnum.CODE),
          HtmlPart: template ? template : 'NO Template found',
        },
      }),
    );
  }
  private createRegisterEmailTemplate() {
    const template = this.getEmailTemplate(EmailTypesEnum.REGISTER);
    this.SESClient.send(
      new CreateTemplateCommand({
        Template: {
          TemplateName: EmailTypesCode[EmailTypesEnum.REGISTER],
          SubjectPart: EmailTypesCode[EmailTypesEnum.REGISTER],
          TextPart: this.getEmailTemplate(EmailTypesEnum.REGISTER),
          HtmlPart: template ? template : 'NO Template found',
        },
      }),
    );
  }
  private createForgottenPasswordEmailTemplate() {
    const template = this.getEmailTemplate(EmailTypesEnum.FORGOTTEN_PASSWORD);
    this.SESClient.send(
      new CreateTemplateCommand({
        Template: {
          TemplateName: EmailTypesCode[EmailTypesEnum.FORGOTTEN_PASSWORD],
          SubjectPart: EmailTypesCode[EmailTypesEnum.FORGOTTEN_PASSWORD],
          TextPart: this.getEmailTemplate(EmailTypesEnum.FORGOTTEN_PASSWORD),
          HtmlPart: template ? template : 'NO Template found',
        },
      }),
    );
  }
  private createChangePasswordEmailTemplate() {
    const template = this.getEmailTemplate(EmailTypesEnum.CHANGE_PASSWORD);
    this.SESClient.send(
      new CreateTemplateCommand({
        Template: {
          TemplateName: EmailTypesCode[EmailTypesEnum.CHANGE_PASSWORD],
          SubjectPart: EmailTypesCode[EmailTypesEnum.CHANGE_PASSWORD],
          TextPart: this.getEmailTemplate(EmailTypesEnum.CHANGE_PASSWORD),
          HtmlPart: template ? template : 'NO Template found',
        },
      }),
    );
  }
  private createReservationCreatedEmailTemplate() {
    const template = this.getEmailTemplate(EmailTypesEnum.RESERVATION_CREATED);
    this.SESClient.send(
      new CreateTemplateCommand({
        Template: {
          TemplateName: EmailTypesCode[EmailTypesEnum.RESERVATION_CREATED],
          SubjectPart: EmailTypesCode[EmailTypesEnum.RESERVATION_CREATED],
          TextPart: this.getEmailTemplate(EmailTypesEnum.RESERVATION_CREATED),
          HtmlPart: template ? template : 'NO Template found',
        },
      }),
    );
  }
}
