import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCampusDto,
  UpdateCampusDto,
  CreateCollegeDto,
  UpdateCollegeDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dto';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================
  // CAMPUS OPERATIONS
  // ===========================================

  async getAllCampuses() {
    return this.prisma.campus.findMany({
      where: { isActive: true },
      include: {
        colleges: {
          where: { isActive: true },
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getCampusById(id: string) {
    const campus = await this.prisma.campus.findUnique({
      where: { id },
      include: {
        colleges: {
          where: { isActive: true },
          include: {
            departments: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!campus) {
      throw new NotFoundException('Campus not found');
    }

    return campus;
  }

  async createCampus(dto: CreateCampusDto) {
    const existing = await this.prisma.campus.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Campus with this code already exists');
    }

    return this.prisma.campus.create({
      data: dto,
    });
  }

  async updateCampus(id: string, dto: UpdateCampusDto) {
    const campus = await this.prisma.campus.findUnique({ where: { id } });
    if (!campus) {
      throw new NotFoundException('Campus not found');
    }

    return this.prisma.campus.update({
      where: { id },
      data: dto,
    });
  }

  // ===========================================
  // COLLEGE OPERATIONS
  // ===========================================

  async getAllColleges(campusId?: string) {
    const where: Record<string, unknown> = { isActive: true };
    if (campusId) where.campusId = campusId;

    return this.prisma.college.findMany({
      where,
      include: {
        campus: { select: { id: true, name: true, code: true } },
        director: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        departments: {
          where: { isActive: true },
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getCollegeById(id: string) {
    const college = await this.prisma.college.findUnique({
      where: { id },
      include: {
        campus: true,
        director: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        departments: {
          where: { isActive: true },
          include: {
            hod: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (!college) {
      throw new NotFoundException('College not found');
    }

    return college;
  }

  async createCollege(dto: CreateCollegeDto) {
    const existing = await this.prisma.college.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('College with this code already exists');
    }

    return this.prisma.college.create({
      data: dto,
      include: {
        campus: { select: { id: true, name: true } },
      },
    });
  }

  async updateCollege(id: string, dto: UpdateCollegeDto) {
    const college = await this.prisma.college.findUnique({ where: { id } });
    if (!college) {
      throw new NotFoundException('College not found');
    }

    return this.prisma.college.update({
      where: { id },
      data: dto,
      include: {
        campus: { select: { id: true, name: true } },
        director: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  // ===========================================
  // DEPARTMENT OPERATIONS
  // ===========================================

  async getAllDepartments(collegeId?: string) {
    const where: Record<string, unknown> = { isActive: true };
    if (collegeId) where.collegeId = collegeId;

    return this.prisma.department.findMany({
      where,
      include: {
        college: { select: { id: true, name: true, code: true } },
        hod: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getDepartmentById(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        college: {
          include: { campus: true },
        },
        hod: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  async createDepartment(dto: CreateDepartmentDto) {
    const existing = await this.prisma.department.findFirst({
      where: {
        collegeId: dto.collegeId,
        code: dto.code,
      },
    });

    if (existing) {
      throw new ConflictException('Department with this code already exists in this college');
    }

    return this.prisma.department.create({
      data: dto,
      include: {
        college: { select: { id: true, name: true } },
      },
    });
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto) {
    const department = await this.prisma.department.findUnique({ where: { id } });
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return this.prisma.department.update({
      where: { id },
      data: dto,
      include: {
        college: { select: { id: true, name: true } },
        hod: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  // ===========================================
  // SEED ORGANIZATION DATA
  // ===========================================

  async seedOrganization() {
    // Create campus
    const campus = await this.prisma.campus.upsert({
      where: { code: 'BBD-LKO' },
      update: {},
      create: {
        name: 'Babu Banarasi Das Educational Group - Lucknow Campus',
        code: 'BBD-LKO',
        city: 'Lucknow',
        state: 'Uttar Pradesh',
        address: 'BBD City, Faizabad Road, Lucknow',
        phone: '+91-522-3911111',
        email: 'info@bbdu.edu.in',
      },
    });

    // Create colleges
    const colleges = [
      { name: 'BBD University', code: 'BBDU' },
      { name: 'BBD NITM', code: 'BBD-NITM' },
      { name: 'BBD NIIT', code: 'BBD-NIIT' },
      { name: 'BBD Dental College', code: 'BBD-DENTAL' },
    ];

    for (const collegeData of colleges) {
      const college = await this.prisma.college.upsert({
        where: { code: collegeData.code },
        update: {},
        create: {
          name: collegeData.name,
          code: collegeData.code,
          campusId: campus.id,
        },
      });

      // Create departments for each college
      const departments = [
        { name: 'Computer Science & Engineering', code: 'CSE' },
        { name: 'Information Technology', code: 'IT' },
        { name: 'Electronics & Communication Engineering', code: 'ECE' },
        { name: 'Mechanical Engineering', code: 'ME' },
        { name: 'Civil Engineering', code: 'CE' },
        { name: 'Electrical Engineering', code: 'EE' },
      ];

      // Only add certain departments to certain colleges
      if (collegeData.code === 'BBD-DENTAL') {
        await this.prisma.department.upsert({
          where: { collegeId_code: { collegeId: college.id, code: 'DENTAL' } },
          update: {},
          create: {
            name: 'Dental Sciences',
            code: 'DENTAL',
            collegeId: college.id,
          },
        });
      } else {
        for (const dept of departments) {
          await this.prisma.department.upsert({
            where: { collegeId_code: { collegeId: college.id, code: dept.code } },
            update: {},
            create: {
              name: dept.name,
              code: dept.code,
              collegeId: college.id,
            },
          });
        }
      }
    }

    return { message: 'Organization data seeded successfully' };
  }
}

