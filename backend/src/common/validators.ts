/**
 * Base DTOs para validación de entrada
 * Usados por todos los endpoints
 */

export interface PaginationDto {
  page: number;
  limit: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export type FilterDto = Record<string, any>;

/**
 * Validador base
 */
export class BaseValidator {
  /**
   * Valida paginación
   */
  static validatePagination(page: any, limit: any): PaginationDto {
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    if (parsedPage < 1) {
      throw new Error('Page must be >= 1');
    }

    if (parsedLimit < 1 || parsedLimit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    return {
      page: parsedPage,
      limit: parsedLimit,
    };
  }

  /**
   * Valida ID (UUID o número)
   */
  static validateId(id: string): string {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid ID');
    }

    // UUID v4 pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    // Numeric ID
    const numericPattern = /^\d+$/;

    if (!uuidPattern.test(id) && !numericPattern.test(id)) {
      throw new Error('ID must be valid UUID or number');
    }

    return id;
  }

  /**
   * Valida email
   */
  static validateEmail(email: string): string {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      throw new Error('Invalid email format');
    }
    return email.toLowerCase();
  }

  /**
   * Valida string no vacío
   */
  static validateString(value: any, fieldName: string, minLength = 1): string {
    if (typeof value !== 'string' || value.trim().length < minLength) {
      throw new Error(`${fieldName} is required and must have at least ${minLength} characters`);
    }
    return value.trim();
  }
}
