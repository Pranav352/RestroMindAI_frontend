export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 32;
export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 6;

/**
 * Evaluates password string against complexity criteria rules
 * @param {string} pass 
 * @returns {object} { length, upper, lower, number, special, isAllValid }
 */
export const evaluatePasswordCriteria = (pass) => {
  if (!pass) {
    return {
      length: false,
      upper: false,
      lower: false,
      number: false,
      special: false,
      isAllValid: false,
    };
  }

  const length = pass.length >= PASSWORD_MIN_LENGTH && pass.length <= PASSWORD_MAX_LENGTH;
  const upper = /[A-Z]/.test(pass);
  const lower = /[a-z]/.test(pass);
  const number = /[0-9]/.test(pass);
  const special = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pass);
  const isAllValid = length && upper && lower && number && special;

  return { length, upper, lower, number, special, isAllValid };
};
