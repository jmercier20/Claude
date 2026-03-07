import {
  Controller, Get, Post, Put, Body, Param, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { CreateCustomerNoteDto } from './dto/create-customer-note.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('customers')
@ApiBearerAuth('access-token')
@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List all customers' })
  findAll(@Query() query: CustomerQueryDto) {
    return this.customersService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get customer statistics' })
  getStats() {
    return this.customersService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer details' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get customer activity timeline' })
  getTimeline(@Param('id') id: string) {
    return this.customersService.getTimeline(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new customer' })
  create(@Body() dto: CreateCustomerDto, @CurrentUser('id') userId: string) {
    return this.customersService.create(dto, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update customer' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add note to customer' })
  addNote(
    @Param('id') id: string,
    @Body() dto: CreateCustomerNoteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.customersService.addNote(id, dto, userId);
  }

  @Post(':id/fraud-flag')
  @ApiOperation({ summary: 'Flag customer for fraud' })
  flagFraud(
    @Param('id') id: string,
    @Body() data: any,
    @CurrentUser('id') userId: string,
  ) {
    return this.customersService.flagFraud(id, data, userId);
  }
}
