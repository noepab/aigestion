import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SystemService } from './system.service';

@ApiTags('System')
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check system health status' })
  @ApiResponse({ status: 200, description: 'Basic health metrics' })
  getHealth() {
    return this.systemService.getHealth();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Retrieve advanced usage metrics' })
  @ApiResponse({ status: 200, description: 'Advanced system metrics' })
  getMetrics() {
    return this.systemService.getMetrics();
  }
}
