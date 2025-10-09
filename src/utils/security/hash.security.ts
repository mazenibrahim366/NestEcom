import  bcrypt  from 'bcrypt';

export const generateHash = async ({
  plainText = '',
  saltRound = process.env.SALT,
} = {}) => {
  return bcrypt.hashSync(plainText, parseInt(saltRound as string))
}

export const compareHash = async ({ plainText = '', hashValue = '' }) => {
  return bcrypt.compareSync(plainText, hashValue)
}
