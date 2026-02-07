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
  NotFoundException,
} from '@nestjs/common';
import { StoreService } from '../store/store.service';
import { AuthGuard, RequestWithUser } from '../common/guards/auth.guard';
import { CreateConnectionDto } from './dto/create-connection.dto';

@Controller()
@UseGuards(AuthGuard)
export class ConnectionsController {
  constructor(private readonly store: StoreService) {}

  private allowSuperadminOrOrgAdmin(req: RequestWithUser, orgId: string): void {
    if (req.user?.userType === 'superadmin') return;
    if (req.user?.userType === 'orgadmin' && req.user?.orgId === orgId) return;
    throw new ForbiddenException('Not allowed to access this org');
  }

  /** Get my connections (serviceprovider: active + pending for me) - MUST be before orgs/:orgId/connections */
  @Get('connections/me')
  myConnections(@Req() req: RequestWithUser) {
    if (req.user?.userType !== 'serviceprovider') {
      throw new ForbiddenException('Service providers only');
    }
    const list = this.store.getConnectionsByHelperId(req.user!.id);
    return list.map((c) => ({
      ...c,
      client: this.store.getClientById(c.clientId),
    }));
  }

  @Patch('connections/:id/accept')
  acceptConnection(@Req() req: RequestWithUser, @Param('id') id: string) {
    if (req.user?.userType !== 'serviceprovider') {
      throw new ForbiddenException('Service providers only');
    }
    const conn = this.store.getConnectionById(id);
    if (!conn) throw new NotFoundException('Connection not found');
    if (conn.helperId !== req.user!.id) {
      throw new ForbiddenException('Not your connection');
    }
    if (conn.status !== 'pending') {
      throw new ForbiddenException('Connection is not pending');
    }
    const updated = this.store.updateConnection(id, {
      status: 'active',
      acceptedAt: new Date().toISOString(),
    });
    return updated;
  }

  @Patch('connections/:id/decline')
  declineConnection(@Req() req: RequestWithUser, @Param('id') id: string) {
    if (req.user?.userType !== 'serviceprovider') {
      throw new ForbiddenException('Service providers only');
    }
    const conn = this.store.getConnectionById(id);
    if (!conn) throw new NotFoundException('Connection not found');
    if (conn.helperId !== req.user!.id) {
      throw new ForbiddenException('Not your connection');
    }
    if (conn.status !== 'pending') {
      throw new ForbiddenException('Connection is not pending');
    }
    const updated = this.store.updateConnection(id, {
      status: 'declined',
      declinedAt: new Date().toISOString(),
    });
    return updated;
  }

  /** List all connections for an org (orgadmin / superadmin) */
  @Get('orgs/:orgId/connections')
  listConnections(@Req() req: RequestWithUser, @Param('orgId') orgId: string) {
    this.allowSuperadminOrOrgAdmin(req, orgId);
    const list = this.store.getConnectionsByOrgId(orgId);
    return list.map((c) => ({
      ...c,
      client: this.store.getClientById(c.clientId),
      helper: this.store.getUserById(c.helperId),
    }));
  }

  /** Create a connection (pending until helper accepts) - orgadmin */
  @Post('orgs/:orgId/connections')
  createConnection(
    @Req() req: RequestWithUser,
    @Param('orgId') orgId: string,
    @Body() body: CreateConnectionDto,
  ) {
    this.allowSuperadminOrOrgAdmin(req, orgId);
    if (req.user?.userType !== 'orgadmin' && req.user?.userType !== 'superadmin') {
      throw new ForbiddenException('Only org admin can create connections');
    }
    const client = this.store.getClientById(body.clientId);
    const helper = this.store.getUserById(body.helperId);
    if (!client || client.orgId !== orgId) throw new ForbiddenException('Client not found');
    if (!helper || helper.orgId !== orgId || helper.userType !== 'serviceprovider') {
      throw new ForbiddenException('Helper not found');
    }
    const conn = this.store.addConnection({
      orgId,
      clientId: body.clientId,
      helperId: body.helperId,
      status: 'pending',
      createdById: req.user!.id,
    });
    return { ...conn, client, helper };
  }
}
