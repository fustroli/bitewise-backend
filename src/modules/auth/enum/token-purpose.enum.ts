// Stored as varchar, so adding a purpose needs no migration
export enum ETokenPurpose {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  // Mailed to the new address
  EMAIL_CHANGE = 'EMAIL_CHANGE',
  // Mailed to the old address
  EMAIL_CHANGE_CANCEL = 'EMAIL_CHANGE_CANCEL',
}
