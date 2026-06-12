import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AnalyzeService } from './analyze.service';
import { AnalyzeDto } from './dto/analyze.dto';
import { AnalysisResults } from './interfaces/analyze-results.interface';

@Controller('api/analyze')
export class AnalyzeController {
    // Dependency Injection: NestJS safely instantiates the service automatically
    constructor(private readonly analyzeService: AnalyzeService) { }

    @Post()
    async analyzeEmail(@Body() body: AnalyzeDto): Promise<AnalysisResults> {
        if (!body || typeof body.text !== 'string') {
            throw new BadRequestException('Invalid input: "text" field is required.');
        }

        // Await database hooks or pipeline execution
        const results = await this.analyzeService.executeAnalysis(body.text);
        return results;
    }
}