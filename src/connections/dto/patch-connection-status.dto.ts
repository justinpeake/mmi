import { IsIn } from 'class-validator';

export class PatchConnectionStatusDto {
  @IsIn(['active', 'paused', 'complete'])
  status: 'active' | 'paused' | 'complete';
}
