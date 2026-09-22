import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SocialProfilesDto } from '../dto/index.js';
import { SocialProfiles } from '../entities/index.js';
import { Repository } from 'typeorm';

@Injectable()
export class SocialProfilesService {
  constructor(
    @InjectRepository(SocialProfiles)
    private readonly repository: Repository<SocialProfiles>,
  ) {}

  async createOne(data: SocialProfilesDto): Promise<SocialProfiles> {
    return this.repository.save(data);
  }

  async updateOne(
    id: number,
    data: SocialProfilesDto,
  ): Promise<SocialProfiles> {
    const socialProfiles = await this.findById(id);

    const updatedSocialProfiles = {
      ...socialProfiles,
      ...data,
    };

    return await this.repository.save(updatedSocialProfiles);
  }

  async findById(id: number): Promise<SocialProfiles> {
    const socialProfiles = await this.repository.findOneBy({ id });

    if (!socialProfiles) {
      throw new NotFoundException(
        `Social profiles for user with ID ${id} not found`,
      );
    }
    return socialProfiles;
  }
}
