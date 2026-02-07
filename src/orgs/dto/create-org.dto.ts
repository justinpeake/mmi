import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateOrgDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  mainContactName: string;

  @IsEmail()
  @IsNotEmpty()
  mainContactEmail: string;
}
