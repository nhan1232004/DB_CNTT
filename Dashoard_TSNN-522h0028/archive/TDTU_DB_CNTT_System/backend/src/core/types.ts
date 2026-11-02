import type { IncomingMessage, ServerResponse } from 'node:http';

export interface UserClaims {
  uid: string;
  email: string;
  name: string;
  role: 'student' | 'lecturer';
  roleId?: string;
  isAdmin: boolean;
  studentId?: string;
  isEnrolledThisSemester?: boolean;
  avatarUrl?: string;
  department?: string;
  iat?: number;
  exp?: number;
}

export interface CustomRequest extends IncomingMessage {
  path: string;
  query: Record<string, string>;
  params: Record<string, string>;
  body: any;
  user?: UserClaims;
}

export type CustomResponse = ServerResponse;

export type RouteHandler = (req: CustomRequest, res: CustomResponse) => Promise<void> | void;

export type Middleware = (req: CustomRequest, res: CustomResponse, next: () => Promise<void> | void) => Promise<void> | void;

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
}
