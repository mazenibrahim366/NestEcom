import CryptoJs from "crypto-js"
export const encryptEncryption = async ({message = '',secretKey=process.env.ENC_SECRET}={}) => {
  return  CryptoJs.AES.encrypt(message,secretKey as string).toString()
    
}

export const decryptEncryption = async ({cipherText = '',secretKey=process.env.ENC_SECRET}={}) => {
 
    return   CryptoJs.AES.decrypt(cipherText,secretKey as string).toString(CryptoJs.enc.Utf8)
    
}
