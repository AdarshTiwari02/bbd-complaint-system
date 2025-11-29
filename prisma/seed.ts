import { PrismaClient, RoleName } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ROLE_PERMISSIONS = {
  STUDENT: ['ticket:create', 'ticket:read'],
  STAFF: ['ticket:create', 'ticket:read'],
  FACULTY: ['ticket:create', 'ticket:read'],
  CLASS_COORDINATOR: [
    'ticket:create', 'ticket:read', 'ticket:update',
    'user:verify:student',
  ],
  PROCTOR: [
    'ticket:create', 'ticket:read', 'ticket:update',
  ],
  HOD: [
    'ticket:create', 'ticket:read', 'ticket:update', 'ticket:assign',
    'ticket:escalate', 'ticket:resolve', 'analytics:view',
    'user:verify:staff', 'user:verify:faculty', 'user:verify:coordinator',
  ],
  DEAN: [
    'ticket:create', 'ticket:read', 'ticket:read:all', 'ticket:update',
    'ticket:assign', 'ticket:escalate', 'ticket:resolve', 'ticket:close',
    'analytics:view', 'analytics:export',
    'user:verify:hod', 'user:verify:proctor', 'role:create',
  ],
  DIRECTOR: [
    'ticket:create', 'ticket:read', 'ticket:read:all', 'ticket:update',
    'ticket:assign', 'ticket:escalate', 'ticket:resolve', 'ticket:close',
    'analytics:view', 'analytics:export',
    'user:verify:hod', 'user:verify:proctor', 'role:create',
  ],
  DIRECTOR_FINANCE: [
    'ticket:read', 'ticket:update', 'ticket:assign', 'ticket:escalate', 'ticket:resolve',
    'analytics:view', 'analytics:export',
  ],
  TRANSPORT_INCHARGE: [
    'ticket:read', 'ticket:update', 'ticket:assign', 'ticket:escalate', 'ticket:resolve',
  ],
  HOSTEL_WARDEN: [
    'ticket:read', 'ticket:update', 'ticket:assign', 'ticket:escalate', 'ticket:resolve',
  ],
  MODERATOR: [
    'ticket:read', 'ticket:read:all', 'moderation:view', 'moderation:approve',
    'moderation:reject', 'suggestion:approve', 'suggestion:feature',
  ],
  CAMPUS_ADMIN: [
    'ticket:create', 'ticket:read', 'ticket:read:all', 'ticket:update',
    'ticket:delete', 'ticket:assign', 'ticket:escalate', 'ticket:resolve',
    'ticket:close', 'ticket:reopen', 'user:read', 'user:update',
    'user:manage-roles', 'org:read', 'org:update', 'analytics:view',
    'analytics:export', 'moderation:view', 'moderation:approve',
    'moderation:reject', 'suggestion:approve', 'suggestion:feature',
  ],
  SYSTEM_ADMIN: ['admin:full-access', 'system:config', 'role:create'],
};

// Which roles can verify which other roles
const VERIFICATION_HIERARCHY = {
  SYSTEM_ADMIN: { canVerify: ['DIRECTOR', 'DEAN', 'HOSTEL_WARDEN', 'TRANSPORT_INCHARGE', 'DIRECTOR_FINANCE', 'CAMPUS_ADMIN', 'MODERATOR'] },
  DIRECTOR: { canVerify: ['HOD', 'PROCTOR'], verifiedBy: ['SYSTEM_ADMIN'] },
  DEAN: { canVerify: ['HOD', 'PROCTOR'], verifiedBy: ['SYSTEM_ADMIN'] },
  HOD: { canVerify: ['STAFF', 'FACULTY', 'CLASS_COORDINATOR'], verifiedBy: ['DIRECTOR', 'DEAN', 'SYSTEM_ADMIN'] },
  CLASS_COORDINATOR: { canVerify: ['STUDENT'], verifiedBy: ['HOD', 'DIRECTOR', 'DEAN', 'SYSTEM_ADMIN'] },
  PROCTOR: { canVerify: [], verifiedBy: ['DIRECTOR', 'DEAN', 'SYSTEM_ADMIN'] },
  STAFF: { canVerify: [], verifiedBy: ['HOD', 'DIRECTOR', 'DEAN', 'SYSTEM_ADMIN'] },
  FACULTY: { canVerify: [], verifiedBy: ['HOD', 'DIRECTOR', 'DEAN', 'SYSTEM_ADMIN'] },
  STUDENT: { canVerify: [], verifiedBy: ['CLASS_COORDINATOR', 'HOD', 'DIRECTOR', 'DEAN', 'SYSTEM_ADMIN'] },
  TRANSPORT_INCHARGE: { canVerify: [], verifiedBy: ['SYSTEM_ADMIN'] },
  HOSTEL_WARDEN: { canVerify: [], verifiedBy: ['SYSTEM_ADMIN'] },
  DIRECTOR_FINANCE: { canVerify: [], verifiedBy: ['SYSTEM_ADMIN'] },
  CAMPUS_ADMIN: { canVerify: [], verifiedBy: ['SYSTEM_ADMIN'] },
  MODERATOR: { canVerify: [], verifiedBy: ['SYSTEM_ADMIN'] },
};

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Roles
  console.log('Creating roles...');
  const roles = [
    { name: 'STUDENT', displayName: 'Student', description: 'Student user' },
    { name: 'STAFF', displayName: 'Staff', description: 'Staff member' },
    { name: 'FACULTY', displayName: 'Faculty', description: 'Faculty member' },
    { name: 'CLASS_COORDINATOR', displayName: 'Class Coordinator', description: 'Class coordinator - verifies students' },
    { name: 'PROCTOR', displayName: 'Proctor', description: 'Proctor' },
    { name: 'HOD', displayName: 'Head of Department', description: 'Department head - verifies staff, faculty, coordinators' },
    { name: 'DEAN', displayName: 'Dean', description: 'College dean - verifies HODs, proctors' },
    { name: 'DIRECTOR', displayName: 'Director', description: 'College director - verifies HODs, proctors' },
    { name: 'DIRECTOR_FINANCE', displayName: 'Director Finance', description: 'Finance director' },
    { name: 'TRANSPORT_INCHARGE', displayName: 'Transport Incharge', description: 'Transport department head' },
    { name: 'HOSTEL_WARDEN', displayName: 'Hostel Warden', description: 'Hostel warden' },
    { name: 'MODERATOR', displayName: 'Moderator', description: 'Content moderator' },
    { name: 'CAMPUS_ADMIN', displayName: 'Campus Administrator', description: 'Campus administrator' },
    { name: 'SYSTEM_ADMIN', displayName: 'System Administrator', description: 'System administrator - verifies directors, deans, etc.' },
  ];

  for (const role of roles) {
    const hierarchy = VERIFICATION_HIERARCHY[role.name as keyof typeof VERIFICATION_HIERARCHY] || { canVerify: [], verifiedBy: [] };
    await prisma.role.upsert({
      where: { name: role.name as RoleName },
      update: {
        displayName: role.displayName,
        description: role.description,
        permissions: ROLE_PERMISSIONS[role.name as keyof typeof ROLE_PERMISSIONS],
        canVerify: hierarchy.canVerify || [],
        verifiedBy: hierarchy.verifiedBy || [],
        canCreateRoles: ['SYSTEM_ADMIN', 'DIRECTOR', 'DEAN'].includes(role.name),
      },
      create: {
        name: role.name as RoleName,
        displayName: role.displayName,
        description: role.description,
        permissions: ROLE_PERMISSIONS[role.name as keyof typeof ROLE_PERMISSIONS],
        canVerify: hierarchy.canVerify || [],
        verifiedBy: hierarchy.verifiedBy || [],
        canCreateRoles: ['SYSTEM_ADMIN', 'DIRECTOR', 'DEAN'].includes(role.name),
        isSystem: true,
      },
    });
  }

  // Seed Campus
  console.log('Creating campus...');
  const campus = await prisma.campus.upsert({
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

  // Seed Colleges
  console.log('Creating colleges...');
  const colleges = [
    { name: 'BBD University', code: 'BBDU' },
    { name: 'BBD NITM', code: 'BBD-NITM' },
    { name: 'BBD NIIT', code: 'BBD-NIIT' },
    { name: 'BBD Dental College', code: 'BBD-DENTAL' },
  ];

  for (const collegeData of colleges) {
    const college = await prisma.college.upsert({
      where: { code: collegeData.code },
      update: {},
      create: {
        name: collegeData.name,
        code: collegeData.code,
        campusId: campus.id,
      },
    });

    // Seed Departments
    const departments = collegeData.code === 'BBD-DENTAL'
      ? [{ name: 'Dental Sciences', code: 'DENTAL' }]
      : [
          { name: 'Computer Science & Engineering', code: 'CSE' },
          { name: 'Information Technology', code: 'IT' },
          { name: 'Electronics & Communication Engineering', code: 'ECE' },
          { name: 'Mechanical Engineering', code: 'ME' },
          { name: 'Civil Engineering', code: 'CE' },
          { name: 'Electrical Engineering', code: 'EE' },
        ];

    for (const dept of departments) {
      await prisma.department.upsert({
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

  // Create System Admin user
  console.log('Creating admin user...');
  const adminRole = await prisma.role.findUnique({ where: { name: 'SYSTEM_ADMIN' } });
  const passwordHash = await bcrypt.hash('Admin@123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@bbdu.edu.in' },
    update: {},
    create: {
      email: 'admin@bbdu.edu.in',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      status: 'ACTIVE',
      emailVerified: true,
      isVerified: true,
      campusId: campus.id,
    },
  });

  if (adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: adminUser.id, roleId: adminRole.id },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });
  }

  // Create test student
  const studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
  const bbduCollege = await prisma.college.findUnique({ where: { code: 'BBDU' } });
  const cseDept = bbduCollege
    ? await prisma.department.findFirst({ where: { collegeId: bbduCollege.id, code: 'CSE' } })
    : null;

  if (studentRole && bbduCollege && cseDept) {
    const testStudent = await prisma.user.upsert({
      where: { email: 'student@bbdu.edu.in' },
      update: {},
      create: {
        email: 'student@bbdu.edu.in',
        passwordHash: await bcrypt.hash('Student@123', 12),
        firstName: 'Test',
        lastName: 'Student',
        studentId: 'BBDU2024001',
        status: 'ACTIVE',
        emailVerified: true,
        isVerified: true,
        campusId: campus.id,
        collegeId: bbduCollege.id,
        departmentId: cseDept.id,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: testStudent.id, roleId: studentRole.id },
      },
      update: {},
      create: {
        userId: testStudent.id,
        roleId: studentRole.id,
      },
    });
  }

  console.log('✅ Seeding completed!');
  console.log('');
  console.log('Default users created:');
  console.log('  Admin: admin@bbdu.edu.in / Admin@123');
  console.log('  Student: student@bbdu.edu.in / Student@123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

