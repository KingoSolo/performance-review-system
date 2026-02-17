import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Decorator to extract company_id from the request
 * The company_id is set by TenantContextMiddleware after verifying the JWT token
 */
export const CompanyId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const companyId = request.user?.companyId;

    if (!companyId) {
      throw new UnauthorizedException('Company ID not found in request. User may not be authenticated.');
    }

    return companyId;
  },
);
