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
} from '@nestjs/common';
import { StoreService } from '../store/store.service';
import { AuthGuard, RequestWithUser } from '../common/guards/auth.guard';
import { CreateOrgDto } from './dto/create-org.dto';
@Controller('orgs')
@UseGuards(AuthGuard)
export class OrgsController {
  constructor(private readonly store: StoreService) {}

  private requireSuperadmin(req: RequestWithUser): void {
    if (req.user?.userType !== 'superadmin') {
      throw new ForbiddenException('Superadmin only');
    }
  }

  private allowSuperadminOrOrgAdmin(req: RequestWithUser, orgId: string): void {
    if (req.user?.userType === 'superadmin') return;
    if (req.user?.userType === 'orgadmin' && req.user?.orgId === orgId) return;
    throw new ForbiddenException('Not allowed to access this org');
  }

  @Get()
  listOrgs(@Req() req: RequestWithUser) {
    this.requireSuperadmin(req);
    return this.store.getAllOrgs();
  }

  @Post()
  createOrg(@Req() req: RequestWithUser, @Body() body: CreateOrgDto) {
    this.requireSuperadmin(req);
    const org = this.store.addOrg({
      name: body.name,
      mainContactName: body.mainContactName,
      mainContactEmail: body.mainContactEmail,
    });
    return org;
  }

  @Get(':id')
  getOrg(@Req() req: RequestWithUser, @Param('id') id: string) {
    this.allowSuperadminOrOrgAdmin(req, id);
    const org = this.store.getOrgById(id);
    if (!org) throw new ForbiddenException('Org not found');
    const clients = this.store.getClientsByOrgId(id);
    const connections = this.store.getConnectionsByOrgId(id);
    const users = this.store.getUsersByOrgId(id);
    const helpers = users.filter((u) => u.userType === 'serviceprovider');
    const orgAdmins = users.filter((u) => u.userType === 'orgadmin');
    return {
      ...org,
      metrics: {
        clientsCount: clients.length,
        helpersCount: helpers.length,
        connectionsCount: connections.length,
        activeConnections: connections.filter((c) => c.status === 'active').length,
        pendingConnections: connections.filter((c) => c.status === 'pending').length,
      },
      mainContacts:
        orgAdmins.length > 0
          ? orgAdmins.map((a) => ({ displayName: a.displayName, email: a.username }))
          : [{ displayName: org.mainContactName, email: org.mainContactEmail }],
    };
  }

  @Patch(':id')
  updateOrg(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: { name?: string; mainContactName?: string; mainContactEmail?: string },
  ) {
    this.requireSuperadmin(req);
    const org = this.store.updateOrg(id, body);
    if (!org) throw new ForbiddenException('Org not found');
    return org;
  }
}
