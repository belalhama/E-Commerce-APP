import * as bcrypt from 'bcryptjs';

export const hashPassword = async (
  plainText: string,
  saltRounds = Number(process.env.SALT_ROUNDS) || 10,
): Promise<string> => {
  return bcrypt.hash(plainText, saltRounds);
};

export const comparePassword = async (
  plainText: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(plainText, hash);
};
