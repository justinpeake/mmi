import { IsInt, Min, Max, IsOptional, IsString, MaxLength } from 'class-validator';

export class SetHelperRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  stars: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
