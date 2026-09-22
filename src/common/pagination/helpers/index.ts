import { PaginationDto } from '../pagination.dto.js';

export function createQueryObject(queryParams: PaginationDto) {
  const { orderBy, orderDirection, limit, offset } = queryParams;

  const order =
    orderBy && orderDirection ? { [orderBy]: orderDirection } : undefined;

  return {
    order,
    take: limit,
    skip: offset,
  };
}
