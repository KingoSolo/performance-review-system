import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../services/prisma.service';

// Extend Express Request to include user info
export interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId: string;
  };
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private supabase;

  constructor(private prisma: PrismaService) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        throw new UnauthorizedException('No authorization token provided');
      }

      const token = authHeader.replace('Bearer ', '');

      // Verify token with Supabase
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error || !data.user) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // CRITICAL: Fetch user from database with company_id
      const user = await this.prisma.user.findUnique({
        where: { id: data.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          companyId: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found in system');
      }

      // Attach user (with company_id) to request object
      req.user = user;

      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
