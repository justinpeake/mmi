import { Module } from '@nestjs/common';
import { HelperRatingsController } from './helper-ratings.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [HelperRatingsController],
})
export class HelperRatingsModule {}
