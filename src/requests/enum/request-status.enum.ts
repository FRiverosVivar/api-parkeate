export enum RequestStatusEnum {
  PENDING_SEND_FORM,
  PENDING_SEND_CALENDAR,
  READY_TO_FINISH,
  FINISHED,
  CANCELED
}
export const RequestStatusNames = [
  "Pendiente de envío de formulario",
  "Pendiente de reunión con equipo",
  "Listo para terminar",
  "Finalizado",
  "Cancelada",
]

export const RequestStatus = [
  RequestStatusEnum.PENDING_SEND_FORM,
  RequestStatusEnum.PENDING_SEND_CALENDAR,
  RequestStatusEnum.READY_TO_FINISH,
  RequestStatusEnum.FINISHED,
  RequestStatusEnum.CANCELED
]