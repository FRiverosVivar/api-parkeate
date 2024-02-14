import { Injectable } from "@nestjs/common";
import {
  createConfiguration,
  DefaultApi,
  Notification,
  CreateNotificationSuccessResponse,
} from "@onesignal/node-onesignal";
@Injectable()
export class NotificationService {
  oneSignalClient: DefaultApi;
  constructor() {
    const config = createConfiguration({
      userKey: "ZjM3NjFiZjAtNWUzOC00NDA4LWE3OTYtNjM5MjAwYWYyZWJl",
      appKey: "c1a44fd3-c87f-4d9f-a7d3-613a918c2006",
    });
    this.oneSignalClient = new DefaultApi(config);
  }
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
  ): Promise<CreateNotificationSuccessResponse> {
    const notification = new Notification();
    notification.contents = {
      en: content,
    };
    notification.headings = {
      en: title,
    };
    notification.include_external_user_ids = array;
    return this.oneSignalClient.createNotification(notification);
  }
}
