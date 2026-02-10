import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ConnectionUpdateMediaItemDto {
  @IsString()
  url: string;

  @IsString()
  type: string; // 'video' | 'image' | 'audio'
}

export class CreateConnectionUpdateDto {
  @IsString()
  @IsNotEmpty()
  eventName: string;

  @IsString()
  @IsNotEmpty()
  eventTime: string; // ISO

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ConnectionUpdateMediaItemDto)
  media?: ConnectionUpdateMediaItemDto[];
}
