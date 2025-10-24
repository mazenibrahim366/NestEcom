export enum signatureTypeEnum {
  system = 'System',
  bearer = 'Bearer',
}
export enum tokenTypeEnum {
  access = 'access',
  refresh = 'refresh',
}
export const logoutEnum = {
  signoutFromAllDevice: 'signoutFromAllDevice',
  signout: 'signout',
  stayLoggedIn: 'stayLoggedIn',
} as const;
export enum genderEnum {
  male = 'male',
  female = 'female',
}
export enum roleEnum {
  User = 'User',
  Admin = 'Admin',
  superAdmin = 'super-admin',
}
export enum providerEnum {
  system = 'system',
  google = 'google',
}
export enum OtpEnum {
  confirmEmail = 'confirm-email',
  resetPassword = 'reset-password',
  twoStepVerification = 'two-step-verification',
}
export enum LanguageEnum {
  AR = 'AR',
  EN = 'EN',
}
