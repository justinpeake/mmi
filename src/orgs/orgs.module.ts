import { Module } from '@nestjs/common';
import { OrgsController } from './orgs.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OrgsController],
})
export class OrgsModule {}
