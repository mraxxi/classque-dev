import { verifyAccessJwt } from '../lib/jwks';
import { IdentityRepository } from '../repositories/identity.repo';
import { Identity } from '../../shared/schemas/identity';
import { notFound } from '../../shared/errors';

export class IdentityService {
  constructor(private repo: IdentityRepository) {}

  async getIdentityFromRequest(
    request: Request,
    env: { ENVIRONMENT: string, DEV_USER_EMAIL?: string, ACCESS_TEAM_DOMAIN?: string, ACCESS_AUD?: string, DB: any }
  ): Promise<Identity | null> {
    
    let email: string | null = null;
    
    if (env.ENVIRONMENT === 'development' && env.DEV_USER_EMAIL) {
      email = env.DEV_USER_EMAIL;
    } else {
      const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
      if (!jwt || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) {
        return null;
      }
      try {
        email = await verifyAccessJwt(jwt, env.ACCESS_TEAM_DOMAIN, env.ACCESS_AUD);
      } catch (e) {
        console.error('JWT validation failed', e);
        return null;
      }
    }
    
    if (!email) return null;

    // Fetch user or auto-provision
    const userRow = await this.repo.findUserByEmail(email);
    if (!userRow) {
      const locale = request.headers.get('X-Client-Locale') === 'id' ? 'id' : 'en';
      let timezone = request.headers.get('X-Client-Timezone') || 'UTC';
      // validate timezone loosely, if invalid fallback to UTC
      try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
      } catch {
        timezone = 'UTC';
      }
      
      const newIdentity = await this.repo.provisionUser(email, locale, timezone);
      return {
        userId: newIdentity.userId,
        accountId: newIdentity.accountId,
        email: newIdentity.email,
        role: newIdentity.role as 'teacher',
        timezone: newIdentity.timezone
      };
    }

    return {
      userId: userRow.userId as string,
      accountId: userRow.accountId as string,
      email: userRow.email as string,
      role: userRow.role as 'teacher',
      timezone: (userRow.timezone as string) || 'UTC'
    };
  }

  requireAccess(identity: Identity, resourceAccountId: string) {
    if (identity.accountId !== resourceAccountId) {
      // Return 404 to hide resource existence
      throw notFound();
    }
  }
}
