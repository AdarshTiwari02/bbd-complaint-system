// ===========================================
// Organization Types
// ===========================================

export interface ICampus {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICampusWithColleges extends ICampus {
  colleges: ICollege[];
}

export interface ICollege {
  id: string;
  name: string;
  code: string;
  campusId: string;
  directorId?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICollegeWithDepartments extends ICollege {
  campus?: ICampus;
  director?: ICollegeDirector;
  departments: IDepartment[];
}

export interface ICollegeDirector {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface IDepartment {
  id: string;
  name: string;
  code: string;
  collegeId: string;
  hodUserId?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDepartmentWithHod extends IDepartment {
  college?: ICollege;
  hod?: IDepartmentHod;
}

export interface IDepartmentHod {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// ===========================================
// Organization Create/Update DTOs
// ===========================================

export interface ICreateCampusRequest {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
}

export interface IUpdateCampusRequest {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface ICreateCollegeRequest {
  name: string;
  code: string;
  campusId: string;
  directorId?: string;
  phone?: string;
  email?: string;
}

export interface IUpdateCollegeRequest {
  name?: string;
  directorId?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface ICreateDepartmentRequest {
  name: string;
  code: string;
  collegeId: string;
  hodUserId?: string;
  phone?: string;
  email?: string;
}

export interface IUpdateDepartmentRequest {
  name?: string;
  hodUserId?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

// ===========================================
// BBD Specific Organization Constants
// ===========================================

export const BBD_CAMPUSES = {
  LUCKNOW: {
    name: 'Babu Banarasi Das Educational Group - Lucknow Campus',
    code: 'BBD-LKO',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
  },
} as const;

export const BBD_COLLEGES = {
  BBDU: {
    name: 'BBD University',
    code: 'BBDU',
  },
  BBD_NITM: {
    name: 'BBD NITM',
    code: 'BBD-NITM',
  },
  BBD_NIIT: {
    name: 'BBD NIIT',
    code: 'BBD-NIIT',
  },
  BBD_DENTAL: {
    name: 'BBD Dental College',
    code: 'BBD-DENTAL',
  },
} as const;

export const BBD_DEPARTMENTS = {
  CSE: { name: 'Computer Science & Engineering', code: 'CSE' },
  IT: { name: 'Information Technology', code: 'IT' },
  ECE: { name: 'Electronics & Communication Engineering', code: 'ECE' },
  ME: { name: 'Mechanical Engineering', code: 'ME' },
  CE: { name: 'Civil Engineering', code: 'CE' },
  EE: { name: 'Electrical Engineering', code: 'EE' },
  PHARMACY: { name: 'Pharmacy', code: 'PHARMACY' },
  DENTAL: { name: 'Dental Sciences', code: 'DENTAL' },
  MBA: { name: 'Master of Business Administration', code: 'MBA' },
  BBA: { name: 'Bachelor of Business Administration', code: 'BBA' },
  BCA: { name: 'Bachelor of Computer Applications', code: 'BCA' },
  MCA: { name: 'Master of Computer Applications', code: 'MCA' },
  LAW: { name: 'Law', code: 'LAW' },
  AGRICULTURE: { name: 'Agriculture', code: 'AGRI' },
  NURSING: { name: 'Nursing', code: 'NURSING' },
  EDUCATION: { name: 'Education', code: 'EDU' },
} as const;

