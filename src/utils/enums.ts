export enum signatureTypeEnum { system= 'System', bearer= 'Bearer' }
export enum tokenTypeEnum  { access= 'access', refresh= 'refresh' }
export const logoutEnum = {
  signoutFromAllDevice: 'signoutFromAllDevice',
  signout: 'signout',
  stayLoggedIn: 'stayLoggedIn',
} as const
export enum genderEnum  { male='male', female='female' } 
export enum roleEnum { User='User', Admin='Admin' ,superAdmin="super-admin"} 
export enum providerEnum  {system ="system",google ="google"}


// export const signatureTypeEnum = { system: 'System', bearer: 'Bearer' } as const
// export const tokenTypeEnum = { access: 'access', refresh: 'refresh' } as const
// export const logoutEnum = {
//   signoutFromAllDevice: 'signoutFromAllDevice',
//   signout: 'signout',
//   stayLoggedIn: 'stayLoggedIn',
// } as const
// export let genderEnum = { male: 'male', female: 'female' } as const
// export let roleEnum = { User: 'User', Admin: 'Admin' } as const
// export let providerEnum = {system : "system",google : "google"}


