import { IsNotEmpty, IsString } from 'class-validator';

export class AnalyzeDto {
  @IsString({ message: '"text" must be a string.' })
  @IsNotEmpty({ message: '"text" must not be empty.' })
  text: string;
}

