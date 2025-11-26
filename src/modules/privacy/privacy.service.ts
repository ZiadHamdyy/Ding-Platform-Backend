import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { Prisma } from '@prisma/client';
import { UpdatePrivacyDto } from './dtos/update-privacy.dto';
import { PrivacyResponseDto } from './dtos/response/privacy.response';

@Injectable()
export class PrivacyService {
  constructor(private readonly prisma: DatabaseService) {}

  async getPrivacySettings(userId: string): Promise<PrivacyResponseDto> {
    const privacy = await this.prisma.profilePrivacy.findUnique({
      where: { profileId: userId },
    });
    // If not set, return defaults (could be handled in DB defaults)
    return privacy as any;
  }

  async updatePrivacySettings(userId: string, dto: UpdatePrivacyDto): Promise<PrivacyResponseDto> {
    const updateData: Prisma.ProfilePrivacyUpdateInput = {};
    const createData: Prisma.ProfilePrivacyUncheckedCreateInput = {
      profileId: userId,
    };

    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (updateData as any)[key] = value;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (createData as any)[key] = value;
      }
    });
    const updated = await this.prisma.profilePrivacy.upsert({
      where: { profileId: userId },
      create: createData,
      update: updateData,
    });
    return updated as any;
  }
}
