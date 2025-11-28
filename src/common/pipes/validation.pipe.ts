// ===== FILE: src/common/pipes/validation.pipe.ts (100% TYPE-SAFE) =====
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Type,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { ValidationError as CustomValidationError } from '../interfaces';

/**
 * 🔥 100% TYPE-SAFE: Custom Validation Pipe
 * Validates incoming DTOs using class-validator
 */
@Injectable()
export class ValidationPipe implements PipeTransform<unknown> {
  async transform(
    value: unknown,
    { metatype }: ArgumentMetadata,
  ): Promise<unknown> {
    // Skip validation if no metatype or not a class to validate
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // 🔥 TYPE-SAFE: Validate input type
    if (typeof value !== 'object' || value === null) {
      throw new BadRequestException('Validation failed: Invalid input type');
    }

    // 🔥 TYPE-SAFE: Cast to Record for plainToInstance
    const objectValue = value as Record<string, unknown>;

    // 🔥 TYPE-SAFE: Use ClassConstructor to avoid 'any'
    const instance = plainToInstance(
      metatype as ClassConstructor<object>,
      objectValue,
    );

    // Validate the object
    const errors = await validate(instance);

    if (errors.length > 0) {
      // 🔥 TYPE-SAFE: Format validation errors using interface
      const messages: CustomValidationError[] = errors.map(
        (err: ValidationError) => ({
          property: err.property,
          constraints: err.constraints || {},
        }),
      );

      throw new BadRequestException({
        message: 'Validation failed',
        errors: messages,
      });
    }

    return instance;
  }

  /**
   * Check if metatype should be validated
   * Skip primitive types
   */
  private toValidate(metatype: Type<unknown>): boolean {
    const types: Type<unknown>[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
