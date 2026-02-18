import { Response } from "express";

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200) {
  res.status(statusCode).json({ success: true, data });
}

export function sendCreated<T>(res: Response, data: T) {
  sendSuccess(res, data, 201);
}
