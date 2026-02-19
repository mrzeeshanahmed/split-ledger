import type { RequestHandler } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { ValidationError } from '../errors/index.js';

export const validate = (schema: ZodSchema): RequestHandler => {
  return (req, _res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        throw new ValidationError('Validation failed', details);
      }
      next(error);
    }
  };
};
