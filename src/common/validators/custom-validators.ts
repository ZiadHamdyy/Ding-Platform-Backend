import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsAdultConstraint implements ValidatorConstraintInterface {
  validate(dateOfBirth: any, args: ValidationArguments) {
    if (!dateOfBirth) return true; // Optional field

    const date = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      return age - 1 >= 13;
    }

    return age >= 13;
  }

  defaultMessage(args: ValidationArguments) {
    return 'You must be at least 13 years old';
  }
}

export function IsAdult(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAdultConstraint,
    });
  };
}

@ValidatorConstraint({ async: false })
export class IsValidDateOfBirthConstraint implements ValidatorConstraintInterface {
  validate(dateOfBirth: any, args: ValidationArguments) {
    if (!dateOfBirth) return true; // Optional field

    const date = new Date(dateOfBirth);
    const today = new Date();

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return false;
    }

    // Check if date is not in the future
    if (date > today) {
      return false;
    }

    // Check if date is not too far in the past (e.g., 150 years)
    const maxAge = 150;
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - maxAge);

    return date >= minDate;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Date of birth must be a valid date in the past';
  }
}

export function IsValidDateOfBirth(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidDateOfBirthConstraint,
    });
  };
}