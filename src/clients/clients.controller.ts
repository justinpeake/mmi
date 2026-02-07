import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { StoreService } from '../store/store.service';
import { AuthGuard, RequestWithUser } from '../common/guards/auth.guard';
import { CreateClientDto } from './dto/create-client.dto';

@Controller('orgs/:orgId/clients')
@UseGuards(AuthGuard)
export class ClientsController {
  constructor(private readonly store: StoreService) {}

  private allowSuperadminOrOrgAdmin(req: RequestWithUser, orgId: string): void {
    if (req.user?.userType === 'superadmin') return;
    if (req.user?.userType === 'orgadmin' && req.user?.orgId === orgId) return;
    throw new ForbiddenException('Not allowed to access this org');
  }

  @Get()
  listClients(@Req() req: RequestWithUser, @Param('orgId') orgId: string) {
    this.allowSuperadminOrOrgAdmin(req, orgId);
    return this.store.getClientsByOrgId(orgId);
  }

  @Post()
  createClient(
    @Req() req: RequestWithUser,
    @Param('orgId') orgId: string,
    @Body() body: CreateClientDto,
  ) {
    this.allowSuperadminOrOrgAdmin(req, orgId);
    const org = this.store.getOrgById(orgId);
    if (!org) throw new ForbiddenException('Org not found');
    return this.store.addClient({
      orgId,
      name: body.name,
      age: body.age,
      bio: body.bio,
      needs: body.needs,
    });
  }
}
