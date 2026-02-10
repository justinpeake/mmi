import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { StoreService } from '../store/store.service';
import { AuthGuard, RequestWithUser } from '../common/guards/auth.guard';
import { SetHelperRatingDto } from './dto/set-helper-rating.dto';

@Controller()
@UseGuards(AuthGuard)
export class HelperRatingsController {
  constructor(private readonly store: StoreService) {}

  private allowSuperadminOrOrgAdmin(req: RequestWithUser, orgId: string): void {
    if (req.user?.userType === 'superadmin') return;
    if (req.user?.userType === 'orgadmin' && req.user?.orgId === orgId) return;
    throw new ForbiddenException('Not allowed to access this org');
  }

  private isHelperInOrg(helper: { orgId: string | null; orgIds?: string[] }, orgId: string): boolean {
    return helper.orgId === orgId || (helper.orgIds != null && helper.orgIds.includes(orgId));
  }

  /** Get internal rating for a helper in an org (orgadmin/superadmin only). */
  @Get('orgs/:orgId/helpers/:helperId/rating')
  getRating(
    @Req() req: RequestWithUser,
    @Param('orgId') orgId: string,
    @Param('helperId') helperId: string,
  ) {
    this.allowSuperadminOrOrgAdmin(req, orgId);
    const helper = this.store.getUserById(helperId);
    if (!helper || helper.userType !== 'serviceprovider' || !this.isHelperInOrg(helper, orgId)) {
      throw new NotFoundException('Helper not found');
    }
    const rating = this.store.getHelperRating(orgId, helperId);
    if (!rating) return { stars: null, notes: null };
    return { stars: rating.stars, notes: rating.notes ?? null };
  }

  /** Set internal rating for a helper in an org (orgadmin/superadmin only). Helper never sees this. */
  @Put('orgs/:orgId/helpers/:helperId/rating')
  setRating(
    @Req() req: RequestWithUser,
    @Param('orgId') orgId: string,
    @Param('helperId') helperId: string,
    @Body() body: SetHelperRatingDto,
  ) {
    this.allowSuperadminOrOrgAdmin(req, orgId);
    if (req.user?.userType !== 'orgadmin' && req.user?.userType !== 'superadmin') {
      throw new ForbiddenException('Only org admin or superadmin can set ratings');
    }
    const helper = this.store.getUserById(helperId);
    if (!helper || helper.userType !== 'serviceprovider' || !this.isHelperInOrg(helper, orgId)) {
      throw new NotFoundException('Helper not found');
    }
    const rating = this.store.setHelperRating(orgId, helperId, {
      stars: body.stars,
      notes: body.notes?.trim() || undefined,
    }, req.user!.id);
    return { stars: rating.stars, notes: rating.notes ?? null };
  }
}
