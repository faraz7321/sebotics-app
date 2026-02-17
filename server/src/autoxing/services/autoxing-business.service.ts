import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtUser } from '../../auth/auth.types';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AutoxingBusinessItem,
  AutoxingBusinessListData,
  AutoxingBuildingItem,
  AutoxingEnvelope,
  AutoxingListPayload,
  getAutoxingItems,
  replaceAutoxingItems,
} from '../types/autoxing-api.types';
import { AutoxingApiService } from './autoxing-api.service';

@Injectable()
export class AutoxingBusinessService {
  constructor(
    @Inject(AutoxingApiService)
    private readonly autoxingApiService: AutoxingApiService,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async getBuildingList(user: JwtUser) {
    const buildingResponse = await this.autoxingApiService.getBuildingList();
    if (user.role === Role.ADMIN) {
      return buildingResponse;
    }

    const authorizedBusinessIds = await this.getAuthorizedBusinessIds(user.userId);
    const businessResponse = await this.autoxingApiService.getBusinessList();

    const authorizedBuildingIds = this.collectAuthorizedBuildingIds(
      businessResponse,
      authorizedBusinessIds,
    );

    return this.filterEnvelopeByIds(
      buildingResponse,
      authorizedBuildingIds,
      (item) => this.extractBuildingId(item),
    );
  }

  async getBusinessList(user: JwtUser) {
    const response = await this.autoxingApiService.getBusinessList();
    if (user.role === Role.ADMIN) {
      return this.enrichBusinessesWithUserIds(response);
    }

    const authorizedBusinessIds = await this.getAuthorizedBusinessIds(user.userId);
    return this.filterEnvelopeByIds(
      response,
      authorizedBusinessIds,
      (item) => this.extractBusinessId(item),
    );
  }

  async assignBusinessToUser(userId: string, businessId: string) {
    const normalizedBusinessId = this.normalizeIdentifier(businessId);
    if (!normalizedBusinessId) {
      throw new BadRequestException('businessId is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.business.upsert({
      where: { id: normalizedBusinessId },
      create: { id: normalizedBusinessId },
      update: {},
    });

    return this.prisma.businessUserMapping.upsert({
      where: {
        userId_businessId: {
          userId,
          businessId: normalizedBusinessId,
        },
      },
      create: {
        userId,
        businessId: normalizedBusinessId,
      },
      update: {},
    });
  }

  async unassignBusinessFromUser(userId: string, businessId: string) {
    const normalizedBusinessId = this.normalizeIdentifier(businessId);
    if (!normalizedBusinessId) {
      throw new BadRequestException('businessId is required');
    }

    const deleted = await this.prisma.businessUserMapping.deleteMany({
      where: {
        userId,
        businessId: normalizedBusinessId,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Business mapping not found');
    }

    return { userId, businessId: normalizedBusinessId };
  }

  async getAuthorizedBusinessIds(userId: string): Promise<Set<string>> {
    const mappings = await this.prisma.businessUserMapping.findMany({
      where: { userId },
      select: { businessId: true },
    });

    return new Set<string>(mappings.map((mapping) => mapping.businessId));
  }

  private collectAuthorizedBuildingIds(
    businessEnvelope: AutoxingEnvelope<AutoxingBusinessListData>,
    authorizedBusinessIds: Set<string>,
  ) {
    const buildingIds = new Set<string>();
    const businessItems = getAutoxingItems(businessEnvelope.data);

    for (const item of businessItems) {
      const businessId = this.extractBusinessId(item);
      if (!businessId || !authorizedBusinessIds.has(businessId)) {
        continue;
      }

      const buildingId = this.extractBuildingId(item);
      if (buildingId) {
        buildingIds.add(buildingId);
      }
    }

    return buildingIds;
  }

  private filterEnvelopeByIds<
    TItem extends Record<string, unknown>,
    TData extends AutoxingListPayload<TItem>,
  >(
    envelope: AutoxingEnvelope<TData>,
    allowedIds: Set<string>,
    getItemId: (item: TItem) => string | null,
  ): AutoxingEnvelope<TData> {
    if (!envelope.data) {
      return envelope;
    }

    const filteredItems = getAutoxingItems(envelope.data).filter((item) => {
      const id = getItemId(item);
      return id !== null && allowedIds.has(id);
    });

    const clonedData = this.deepClone(envelope.data);
    replaceAutoxingItems(clonedData, filteredItems);

    return {
      ...envelope,
      data: clonedData,
    };
  }

  private extractBusinessId(item: AutoxingBusinessItem) {
    const rawValue = item.id ?? item.businessId;
    return this.normalizeIdentifier(rawValue);
  }

  private extractBuildingId(item: AutoxingBusinessItem | AutoxingBuildingItem) {
    const rawValue = item.buildingId ?? item.id;
    return this.normalizeIdentifier(rawValue);
  }

  private normalizeIdentifier(value: unknown) {
    if (typeof value === 'string') {
      const normalized = value.trim();
      return normalized.length > 0 ? normalized : null;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }

    return null;
  }

  private deepClone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  private async enrichBusinessesWithUserIds(
    envelope: AutoxingEnvelope<AutoxingBusinessListData>,
  ): Promise<AutoxingEnvelope<AutoxingBusinessListData>> {
    if (!envelope.data) {
      return envelope;
    }

    const allMappings = await this.prisma.businessUserMapping.findMany({
      select: { businessId: true, userId: true },
    });

    const userIdsByBusinessId = new Map<string, string[]>();
    for (const mapping of allMappings) {
      const existing = userIdsByBusinessId.get(mapping.businessId) ?? [];
      existing.push(mapping.userId);
      userIdsByBusinessId.set(mapping.businessId, existing);
    }

    const clonedData = this.deepClone(envelope.data);
    const items = getAutoxingItems(clonedData);

    for (const item of items) {
      const businessId = this.extractBusinessId(item);
      if (businessId) {
        item.userIds = userIdsByBusinessId.get(businessId) ?? [];
      }
    }

    return {
      ...envelope,
      data: clonedData,
    };
  }
}
