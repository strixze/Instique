import crypto from 'crypto';

export const generateOTP = (min = 100000, max = 999999) => {
    const otp = crypto.randomInt(min, max).toString();
    return otp;
}