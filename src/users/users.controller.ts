import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { StoreService } from '../store/store.service';
import { AuthGuard, RequestWithUser } from '../common/guards/auth.guard';
import { AddUserDto } from './dto/add-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponse } from '../common/types';

function toResponse(
  user: { id: string; username: string; userType: string; orgId: string | null; orgIds?: string[]; displayName: string; bio?: string; needs?: string[] },
  orgNames?: string[],
): UserResponse {
  return {
    id: user.id,
    username: user.username,
    userType: user.userType as UserResponse['userType'],
    orgId: user.orgId,
    orgIds: user.orgIds,
    orgNames: orgNames,
    displayName: user.displayName,
    bio: user.bio,
    needs: user.needs,
  };
}

@Controller()
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly store: StoreService) {}

  private getOrgNamesForUser(user: { orgId: string | null; orgIds?: string[] }): string[] {
    const orgIds = user.orgIds?.length ? user.orgIds : (user.orgId ? [user.orgId] : []);
    return orgIds
      .map((id) => this.store.getOrgById(id)?.name)
      .filter((n): n is string => !!n);
  }

  private allowSuperadminOrOrgAdmin(req: RequestWithUser, orgId: string): void {
    if (req.user?.userType === 'superadmin') return;
    if (req.user?.userType === 'orgadmin' && req.user?.orgId === orgId) return;
    throw new ForbiddenException('Not allowed to access this org');
  }

  /** List users in org (orgadmin / superadmin) */
  @Get('orgs/:orgId/users')
  listUsers(@Req() req: RequestWithUser, @Param('orgId') orgId: string) {
    this.allowSuperadminOrOrgAdmin(req, orgId);
    const users = this.store.getUsersByOrgId(orgId);
    return users.map((u) => {
      const orgIds = u.orgIds?.length ? u.orgIds : (u.orgId ? [u.orgId] : []);
      const orgNames = orgIds
        .map((id) => this.store.getOrgById(id)?.name)
        .filter((n): n is string => !!n);
      return toResponse(u, orgNames);
    });
  }

  /** Add user to org (orgadmin or superadmin) - orgadmin can add orgadmin or serviceprovider */
  @Post('orgs/:orgId/users')
  addUser(
    @Req() req: RequestWithUser,
    @Param('orgId') orgId: string,
    @Body() body: AddUserDto,
  ) {
    this.allowSuperadminOrOrgAdmin(req, orgId);
    const org = this.store.getOrgById(orgId);
    if (!org) throw new ForbiddenException('Org not found');
    const existing = this.store.findUserByUsername(body.username);
    if (existing) throw new ConflictException('Username already in use');
    const user = this.store.addUser({
      username: body.username.trim(),
      userType: body.userType,
      orgId,
      displayName: body.displayName,
      bio: body.bio,
      needs: body.needs,
    });
    return toResponse(user, this.getOrgNamesForUser(user));
  }

  /** Update my profile (serviceprovider or any user) */
  @Patch('users/me')
  updateMyProfile(@Req() req: RequestWithUser, @Body() body: UpdateProfileDto) {
    const user = this.store.getUserById(req.user!.id);
    if (!user) throw new ForbiddenException('User not found');
    const updated = this.store.updateUser(req.user!.id, {
      displayName: body.displayName,
      bio: body.bio,
      needs: body.needs,
    });
    return toResponse(updated!, this.getOrgNamesForUser(updated!));
  }

  /** Get my profile */
  @Get('users/me')
  getMyProfile(@Req() req: RequestWithUser) {
    const user = this.store.getUserById(req.user!.id);
    if (!user) throw new ForbiddenException('User not found');
    return toResponse(user, this.getOrgNamesForUser(user));
  }
}
