import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(private prisma: PrismaService) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Sign up a new user and create their company
   */
  async signUp(email: string, password: string, name: string, companyName: string) {
    // 1. Create Supabase auth user
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      throw new UnauthorizedException(authError?.message || 'Sign up failed');
    }

    // 2. Create company
    const company = await this.prisma.company.create({
      data: {
        name: companyName,
      },
    });

    // 3. Create user in our database (as ADMIN of their company)
    const user = await this.prisma.user.create({
      data: {
        id: authData.user.id, // Use Supabase user ID
        companyId: company.id,
        email,
        name,
        password: '', // Password managed by Supabase
        role: 'ADMIN',
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
      },
      session: authData.session,
    };
  }

  /**
   * Sign in existing user
   */
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Fetch user details from our database
    const user = await this.prisma.user.findUnique({
      where: { id: data.user.id },
      include: {
        company: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found in system');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company.name,
      },
      session: data.session,
    };
  }

  /**
   * Sign out user
   */
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw new UnauthorizedException('Sign out failed');
    }
    return { message: 'Signed out successfully' };
  }

  /**
   * Verify JWT token and return user info
   */
  async verifyToken(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Fetch user from database with company info
    const user = await this.prisma.user.findUnique({
      where: { id: data.user.id },
      include: {
        company: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      companyName: user.company.name,
    };
  }

  /**
   * Get user by ID (with company_id filtering)
   */
  async getUserById(userId: string, companyId: string) {
    // CRITICAL: Always filter by company_id for multi-tenancy
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        companyId: companyId,
      },
      include: {
        company: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or access denied');
    }

    return user;
  }
}
