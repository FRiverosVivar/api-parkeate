export enum InAdvanceBooking {
  STATE_TO_RESERVED,
  LESS_THAN_15, // 0.15
  LESS_THAN_30, // 0.30
  LESS_THAN_60, // 1
  LESS_THAN_180, // 3
  LESS_THAN_360, // 6
  LESS_THAN_1440, // 24
  LESS_THAN_10080, // 7x24
  IGNORE, // 7x24
}
