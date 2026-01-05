import { HttpStatusCode } from './errors';

/**
 * Standard API Response format
 */
export class ApiResponse<T> {
  public readonly success: boolean = true;
  public readonly status: string = 'success';
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data?: T;

  constructor(statusCode: HttpStatusCode, message: string, data?: T) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  /**
   * Static helper for 200 OK responses
   */
  static success<T>(message: string, data?: T) {
    return new ApiResponse(HttpStatusCode.OK, message, data);
  }

  /**
   * Static helper for 201 Created responses
   */
  static created<T>(message: string, data?: T) {
    return new ApiResponse(HttpStatusCode.CREATED, message, data);
  }
}
