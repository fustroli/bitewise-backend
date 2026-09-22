import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationSettingsDto } from '../dto/index.js';
import { NotificationSettings } from '../entities/index.js';
import { Repository } from 'typeorm';

@Injectable()
export class NotificationSettingsService {
  constructor(
    @InjectRepository(NotificationSettings)
    private readonly repository: Repository<NotificationSettings>,
  ) {}

  async createOne(
    data: NotificationSettingsDto,
  ): Promise<NotificationSettings> {
    return this.repository.save(data);
  }

  async updateOne(
    id: number,
    data: NotificationSettingsDto,
  ): Promise<NotificationSettings> {
    const notificationSettings = await this.findById(id);

    const updatedNotificationSettings = {
      ...notificationSettings,
      ...data,
    };

    return await this.repository.save(updatedNotificationSettings);
  }

  async findById(id: number): Promise<NotificationSettings> {
    const notificationSettings = await this.repository.findOneBy({ id });

    if (!notificationSettings) {
      throw new NotFoundException(
        `Notification settings for user with ID ${id} not found`,
      );
    }
    return notificationSettings;
  }
}
