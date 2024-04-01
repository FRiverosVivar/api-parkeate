import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { DefaultApi, Notification } from "@onesignal/node-onesignal";
import { AxiosResponse } from "axios";
import { Observable } from "rxjs";
@Injectable()
export class NotificationService {
  oneSignalClient: DefaultApi;
  oneSignalURL = "https://onesignal.com/api/v1/notifications";
  oneSignalAPPID = "c1a44fd3-c87f-4d9f-a7d3-613a918c2006";
  oneSignalTOKENID = "ZjM3NjFiZjAtNWUzOC00NDA4LWE3OTYtNjM5MjAwYWYyZWJl";
  constructor(private readonly httpService: HttpService) {}

  sendNotificationToAllSubscribers(title: string, content: string) {
    const notification = new Notification();
    notification.contents = {
      en: content,
    };
    notification.headings = {
      en: title,
    };
    notification.included_segments = ["Subscribed Users"];
    return this.oneSignalClient.createNotification(notification);
  }

  sendNotificationToListOfUsers(
    array: string[],
    title: string,
    content: string
  ): Observable<AxiosResponse<any, any>> {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Basic ${this.oneSignalTOKENID}`,
    };
    const body = {
      app_id: this.oneSignalAPPID,
      include_aliases: {
        external_id: array,
      },
      target_channel: "push",
      headings: {
        en: title,
      },
      contents: {
        en: content,
      },
    };

    return this.httpService.post(this.oneSignalURL, body, {
      headers: headers,
    });
    // const notification = new Notification();
    // notification.contents = {
    //   en: content,
    // };
    // notification.headings = {
    //   en: title,
    // };
    // notification.target_channel = "push";
    // // notification.include_external_user_ids = array;
    // return this.oneSignalClient.createNotification(notification);
  }
}
