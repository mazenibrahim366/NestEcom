import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({ name: 'check_matching_between_fields', async: false })
export class IsMatchedMethod<T> implements ValidatorConstraintInterface {
  validate(confirmValue: T, args: ValidationArguments) {
    return confirmValue === args.object[args.constraints[0]];
  }
  defaultMessage(validationArguments?: ValidationArguments): string {
    return ` misMatch confirmation `;
  }
}
export function IsMatched<T = any>(
  constraints: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints,
      validator: IsMatchedMethod<T>,
    });
  };
}