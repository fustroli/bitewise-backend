import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PersonalInformation } from '../entities/index.js';
import { PersonalInformationDto } from '../dto/index.js';

@Injectable()
export class PersonalInformationService {
  constructor(
    @InjectRepository(PersonalInformation)
    private readonly repository: Repository<PersonalInformation>,
  ) {}

  async createOne(data: PersonalInformationDto): Promise<PersonalInformation> {
    return this.repository.save(data);
  }

  async updateOne(
    id: number,
    data: PersonalInformationDto,
  ): Promise<PersonalInformation> {
    const personalInformation = await this.findById(id);

    await this.checkExistingUsername(data.userName, id);

    const updatedPersonalInformation = {
      ...personalInformation,
      ...data,
    };

    return await this.repository.save(updatedPersonalInformation);
  }

  async findById(id: number): Promise<PersonalInformation> {
    const personalInformation = await this.repository.findOneBy({ id });

    if (!personalInformation) {
      throw new NotFoundException(
        `Personal information with ID ${id} not found`,
      );
    }
    return personalInformation;
  }

  private async checkExistingUsername(userName: string, excludeId: number) {
    const existingUsername = await this.repository.findOne({
      where: { userName: userName, id: Not(excludeId) },
    });

    if (existingUsername) {
      throw new ConflictException(`Username '${userName}' is already taken.`);
    }
  }
}
