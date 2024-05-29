export enum RequestStatusEnum {
  PENDING_SEND_FORM,
  PENDING_SEND_CALENDAR,
  FINISHED,
  CANCELED
}
export const RequestStatusNames = [
  "Formulario por Completar",
  "Pendiente de reunión con equipo",
  "Finalizado",
  "Cancelada",
]

export const RequestStatus = [
  RequestStatusEnum.PENDING_SEND_FORM,
  RequestStatusEnum.PENDING_SEND_CALENDAR,
  RequestStatusEnum.FINISHED,
  RequestStatusEnum.CANCELED
]