import { ValidateBy, ValidationOptions, buildMessage } from 'class-validator';

// class-validator's IsDivisibleBy parseInts its divisor, so it can't take 0.5
export function IsMultipleOf(
  step: number,
  validationOptions?: ValidationOptions,
) {
  return ValidateBy(
    {
      name: 'isMultipleOf',
      constraints: [step],
      validator: {
        validate: (value: unknown) =>
          typeof value === 'number' && Number.isInteger(value / step),
        defaultMessage: buildMessage(
          (eachPrefix) =>
            `${eachPrefix}$property must be a multiple of $constraint1`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
