import { IsString, IsNotEmpty, IsIn, MinLength, IsOptional, IsArray } from 'class-validator';

export class AddUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  username: string;

  @IsIn(['orgadmin', 'serviceprovider'])
  userType: 'orgadmin' | 'serviceprovider';

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  displayName: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  needs?: string[];
}
