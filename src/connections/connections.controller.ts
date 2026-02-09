import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { StoreService } from '../store/store.service';
import { AuthGuard, RequestWithUser } from '../common/guards/auth.guard';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { CreateConnectionUpdateDto } from './dto/create-connection-update.dto';
import { PatchConnectionStatusDto } from './dto/patch-connection-status.dto';
import { ConnectionUpdateMediaType } from '../common/types';

@Controller()
@UseGuards(AuthGuard)
export class ConnectionsController {
  constructor(private readonly store: StoreService) {}

  private allowSuperadminOrOrgAdmin(req: RequestWithUser, orgId: string): void {
    if (req.user?.userType === 'superadmin') return;
    if (req.user?.userType === 'orgadmin' && req.user?.orgId === orgId) return;
    throw new ForbiddenException('Not allowed to access this org');
  }

  /** Get my connections (serviceprovider: active + pending for me). Optional orgId filters to that org. */
  @Get('connections/me')
  myConnections(@Req() req: RequestWithUser, @Query('orgId') orgId?: string) {
    if (req.user?.userType !== 'serviceprovider') {
      throw new ForbiddenException('Service providers only');
    }
    let list = this.store.getConnectionsByHelperId(req.user!.id);
    if (orgId && orgId.trim()) {
      list = list.filter((c) => c.orgId === orgId.trim());
    }
    return list.map((c) => ({
      ...c,
      client: this.store.getClientById(c.clientId),
    }));
  }

  /** Map updates to include createdByDisplayName for display. */
  private withCreatorDisplayNames(updates: { createdBy: string }[]) {
    return updates.map((u) => {
      const creator = this.store.getUserById(u.createdBy);
      return { ...u, createdByDisplayName: creator?.displayName ?? 'Staff' };
    });
  }

  /** Get one connection by id (helper of that connection, or orgadmin/superadmin with org access). Returns connection + client + helper + updates. */
  @Get('connections/:id')
  getConnection(@Req() req: RequestWithUser, @Param('id') id: string) {
    const conn = this.store.getConnectionById(id);
    if (!conn) throw new NotFoundException('Connection not found');
    if (req.user?.userType === 'serviceprovider') {
      if (conn.helperId !== req.user.id) throw new ForbiddenException('Not your connection');
    } else {
      this.allowSuperadminOrOrgAdmin(req, conn.orgId);
    }
    const client = this.store.getClientById(conn.clientId);
    const helper = this.store.getUserById(conn.helperId);
    const updates = this.withCreatorDisplayNames(this.store.getUpdatesByConnectionId(id));
    return { ...conn, client, helper, updates };
  }

  /** Add a session/engagement update to a connection (helper only). */
  @Post('connections/:id/updates')
  addConnectionUpdate(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: CreateConnectionUpdateDto,
  ) {
    const conn = this.store.getConnectionById(id);
    if (!conn) throw new NotFoundException('Connection not found');
    if (req.user?.userType !== 'serviceprovider' || conn.helperId !== req.user!.id) {
      throw new ForbiddenException('Only the helper of this connection can add updates');
    }
    const media = (body.media || []).map((m) => ({
      url: m.url,
      type: (m.type === 'video' || m.type === 'image' || m.type === 'audio' ? m.type : 'image') as ConnectionUpdateMediaType,
    }));
    const update = this.store.addConnectionUpdate({
      connectionId: id,
      eventName: body.eventName.trim(),
      eventTime: body.eventTime,
      notes: body.notes?.trim(),
      media: media.length ? media : undefined,
      createdBy: req.user!.id,
    });
    return this.withCreatorDisplayNames([update])[0];
  }

  /** Update connection status (helper: own connection only; orgadmin/superadmin: any connection in org). */
  @Patch('connections/:id/status')
  updateConnectionStatus(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: PatchConnectionStatusDto,
  ) {
    const conn = this.store.getConnectionById(id);
    if (!conn) throw new NotFoundException('Connection not found');
    if (req.user?.userType === 'serviceprovider') {
      if (conn.helperId !== req.user.id) throw new ForbiddenException('Not your connection');
    } else {
      this.allowSuperadminOrOrgAdmin(req, conn.orgId);
    }
    const updated = this.store.updateConnection(id, { status: body.status });
    return updated;
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

  /** List all connections for an org (orgadmin / superadmin). Includes updates per connection. */
  @Get('orgs/:orgId/connections')
  listConnections(@Req() req: RequestWithUser, @Param('orgId') orgId: string) {
    this.allowSuperadminOrOrgAdmin(req, orgId);
    const list = this.store.getConnectionsByOrgId(orgId);
    return list.map((c) => {
      const updates = this.withCreatorDisplayNames(this.store.getUpdatesByConnectionId(c.id));
      return {
        ...c,
        client: this.store.getClientById(c.clientId),
        helper: this.store.getUserById(c.helperId),
        updates,
      };
    });
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
