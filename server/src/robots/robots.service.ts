import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RobotsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async registerRobot(serialNumber: string) {
    const existing = await this.prisma.robot.findUnique({
      where: { serialNumber },
    });

    if (existing) {
      throw new BadRequestException('Robot already registered');
    }

    return this.prisma.robot.create({ data: { serialNumber } });
  }

  async assignRobot(serialNumber: string, userId: string) {
    const robot = await this.prisma.robot.findUnique({
      where: { serialNumber },
    });

    if (!robot) {
      throw new NotFoundException('Robot not found');
    }

    if (robot.assignedUserId) {
      throw new BadRequestException('Robot already assigned');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.robot.update({
      where: { id: robot.id },
      data: { assignedUserId: userId, assignedAt: new Date() },
    });
  }

  async unassignRobot(serialNumber: string) {
    const robot = await this.prisma.robot.findUnique({
      where: { serialNumber },
    });

    if (!robot) {
      throw new NotFoundException('Robot not found');
    }

    return this.prisma.robot.update({
      where: { id: robot.id },
      data: { assignedUserId: null, assignedAt: null },
    });
  }

  listAllRobots() {
    return this.prisma.robot.findMany({
      include: {
        assignedUser: { select: { id: true, username: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listRobotsForUser(userId: string) {
    return this.prisma.robot.findMany({
      where: { assignedUserId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
