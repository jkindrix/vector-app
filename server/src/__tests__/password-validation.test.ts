// validatePassword is not exported from admin.ts, so we replicate the logic here
// to test the validation rules. The same rules also exist in Database.createAdminUser.
// If the function is later exported, this can be updated to import it directly.

function validatePassword(password: string): string | null {
  if (password.length < 12) {
    return 'Password must be at least 12 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one digit';
  }
  return null;
}

describe('validatePassword', () => {
  it('rejects passwords shorter than 12 characters', () => {
    expect(validatePassword('Short1Aa')).toBe('Password must be at least 12 characters long');
  });

  it('rejects passwords without uppercase letters', () => {
    expect(validatePassword('alllowercase1')).toBe('Password must contain at least one uppercase letter');
  });

  it('rejects passwords without lowercase letters', () => {
    expect(validatePassword('ALLUPPERCASE1')).toBe('Password must contain at least one lowercase letter');
  });

  it('rejects passwords without digits', () => {
    expect(validatePassword('NoDigitsHereAbc')).toBe('Password must contain at least one digit');
  });

  it('accepts a valid password', () => {
    expect(validatePassword('ValidPass1234')).toBeNull();
  });
});
