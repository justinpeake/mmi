import { IsString, IsNotEmpty } from 'class-validator';

export class CreateConnectionDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  helperId: string;
}
