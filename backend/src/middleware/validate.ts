import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

interface ValidationTargets {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export const validate = (schemas: ValidationTargets) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = (await schemas.query.parseAsync(req.query)) as Request['query'];
      }
      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(req.params)) as Request['params'];
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid request data',
            code: 'VALIDATION_ERROR',
            details: {
              ...error.flatten().fieldErrors,
              ...(error.flatten().formErrors.length && { _form: error.flatten().formErrors }),
            },
          },
        });
        return;
      }
      next(error);
    }
  };
};
