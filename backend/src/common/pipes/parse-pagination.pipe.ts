import { PipeTransform, Injectable } from '@nestjs/common';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

@Injectable()
export class ParsePaginationPipe implements PipeTransform {
  transform(value: any): PaginationParams {
    const page = Math.max(1, parseInt(value?.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(value?.limit, 10) || 20));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }
}
