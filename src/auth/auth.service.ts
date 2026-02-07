import { Injectable, UnauthorizedException } from '@nestjs/common';
import { StoreService } from '../store/store.service';
import { UserResponse } from '../common/types';

export interface LoginResult {
  user: UserResponse;
  token: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly store: StoreService) {}

  login(username: string): LoginResult {
    const normalized = username.trim();
    if (!normalized) {
      throw new UnauthorizedException('Username is required');
    }
    const user = this.store.findUserByUsername(normalized);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const token = this.store.createToken(user.id);
    return {
      user: this.toResponse(user),
      token,
    };
  }

  validateToken(token: string): UserResponse | null {
    const userId = this.store.getUserIdByToken(token);
    if (!userId) return null;
    const user = this.store.getUserById(userId);
    return user ? this.toResponse(user) : null;
  }

  private toResponse(user: { id: string; username: string; userType: string; orgId: string | null; orgIds?: string[]; displayName: string; bio?: string; needs?: string[] }): UserResponse {
    const orgIds = user.orgIds?.length ? user.orgIds : (user.orgId ? [user.orgId] : []);
    const orgNames = orgIds
      .map((id) => this.store.getOrgById(id)?.name)
      .filter((n): n is string => !!n);
    return {
      id: user.id,
      username: user.username,
      userType: user.userType as UserResponse['userType'],
      orgId: user.orgId,
      orgIds: orgIds.length ? orgIds : undefined,
      orgNames: orgNames.length ? orgNames : undefined,
      displayName: user.displayName,
      bio: user.bio,
      needs: user.needs,
    };
  }
}
