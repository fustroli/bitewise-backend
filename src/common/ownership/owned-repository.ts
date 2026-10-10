import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  DeepPartial,
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';
import {
  DEFAULT_PAGE_LIMIT,
  EOrderDirection,
  IPaginated,
  MAX_PAGE_LIMIT,
  PaginationDto,
} from '../pagination/index.js';

export interface IOwnedEntity {
  id: number;
  user: { id: number };
}

export interface IOwnedRepositoryConfig<T> {
  // Used in error messages, e.g. "ingredient" → "No ingredient found ..."
  label: string;
  // Loaded by findOwnedOrFail and listOwned unless overridden per call
  relations?: FindOptionsRelations<T>;
  // Columns a client may pass as `orderBy`; anything else is a 400
  sortable: readonly (keyof T & string)[];
}

/**
 * Owner-scoped access to an Owned resource. Every query is filtered by the
 * Owner, so a resource that belongs to someone else behaves exactly like one
 * that does not exist (404).
 */
export class OwnedRepository<T extends IOwnedEntity> {
  constructor(
    private readonly repository: Repository<T>,
    private readonly config: IOwnedRepositoryConfig<T>,
  ) {}

  async findOwnedOrFail(
    id: number,
    ownerId: number,
    relations: FindOptionsRelations<T> | undefined = this.config.relations,
  ): Promise<T> {
    const entity = await this.repository.findOne({
      where: this.ownedWhere(ownerId, { id }),
      relations,
    });

    if (!entity) {
      throw new NotFoundException(
        `No ${this.config.label} found with the provided id.`,
      );
    }

    return entity;
  }

  async findManyOwned(ids: number[], ownerId: number): Promise<T[]> {
    const uniqueIds = [...new Set(ids)];
    const entities = await this.repository.find({
      where: this.ownedWhere(ownerId, { id: In(uniqueIds) }),
      relations: this.config.relations,
    });

    const missing = uniqueIds.filter(
      (id) => !entities.some((entity) => entity.id === id),
    );
    if (missing.length) {
      throw new NotFoundException(
        `No ${this.config.label} found with id ${missing.join(', ')}.`,
      );
    }

    return entities;
  }

  async listOwned(
    ownerId: number,
    pagination: PaginationDto,
  ): Promise<IPaginated<T>> {
    const [data, count] = await this.repository.findAndCount({
      where: this.ownedWhere(ownerId),
      relations: this.config.relations,
      order: this.order(pagination),
      take: Math.min(pagination.limit ?? DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT),
      skip: pagination.offset,
    });

    return { data, count };
  }

  async createOwned(data: DeepPartial<T>, ownerId: number): Promise<T> {
    const entity = this.repository.create({
      ...data,
      user: { id: ownerId },
    } as DeepPartial<T>);
    const saved = await this.repository.save(entity);

    // Reload so the result has the same shape as findOwnedOrFail
    return this.findOwnedOrFail(saved.id, ownerId);
  }

  async softDeleteOwned(id: number, ownerId: number): Promise<void> {
    await this.findOwnedOrFail(id, ownerId, {});
    await this.repository.softDelete(id);
  }

  private ownedWhere(
    ownerId: number,
    where: Record<string, unknown> = {},
  ): FindOptionsWhere<T> {
    return { ...where, user: { id: ownerId } } as FindOptionsWhere<T>;
  }

  private order({
    orderBy,
    orderDirection,
  }: PaginationDto): FindOptionsOrder<T> | undefined {
    if (!orderBy) return undefined;

    if (!(this.config.sortable as readonly string[]).includes(orderBy)) {
      throw new BadRequestException(
        `orderBy must be one of: ${this.config.sortable.join(', ')}`,
      );
    }

    return {
      [orderBy]: orderDirection ?? EOrderDirection.ASC,
    } as FindOptionsOrder<T>;
  }
}
