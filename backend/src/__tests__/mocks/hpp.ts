import { jest } from '@jest/globals';

const hpp = jest.fn(() => (_req: any, _res: any, next: any) => next());

export default hpp;
