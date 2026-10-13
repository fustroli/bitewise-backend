import { plainToInstance } from 'class-transformer';
import { NormalizeEmail } from './normalize-email.decorator.js';

class EmailDto {
  @NormalizeEmail()
  email?: unknown;
}

describe('NormalizeEmail', () => {
  const toDto = (email: unknown) => plainToInstance(EmailDto, { email });

  it('trims and lowercases', () => {
    expect(toDto('  John.Doe@Example.COM ').email).toBe('john.doe@example.com');
  });

  it.each([null, undefined, 42])('leaves %p untouched', (value) => {
    expect(toDto(value).email).toBe(value);
  });
});
