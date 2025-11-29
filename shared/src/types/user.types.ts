// ===========================================
// User Types
// ===========================================

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum RoleName {
  STUDENT = 'STUDENT',
  STAFF = 'STAFF',
  HOD = 'HOD',
  DIRECTOR = 'DIRECTOR',
  CAMPUS_ADMIN = 'CAMPUS_ADMIN',
  TRANSPORT_INCHARGE = 'TRANSPORT_INCHARGE',
  HOSTEL_WARDEN = 'HOSTEL_WARDEN',
  MODERATOR = 'MODERATOR',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
}

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  studentId?: string;
  employeeId?: string;
  avatarUrl?: string;
  campusId?: string;
  collegeId?: string;
  departmentId?: string;
  status: UserStatus;
  mfaEnabled: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserWithRoles extends IUser {
  roles: IRole[];
}

export interface IRole {
  id: string;
  name: RoleName;
  displayName: string;
  description?: string;
  permissions: string[];
}

export interface ILoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  studentId?: string;
  employeeId?: string;
  campusId?: string;
  collegeId?: string;
  departmentId?: string;
  role?: RoleName;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface IAuthResponse {
  user: IUserWithRoles;
  tokens: IAuthTokens;
}

export interface IMfaSetupResponse {
  secret: string;
  qrCodeUrl: string;
  recoveryCodes: string[];
}

export interface IPasswordResetRequest {
  email: string;
}

export interface IPasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface IUserProfileUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface IJwtPayload {
  sub: string;
  email: string;
  roles: RoleName[];
  campusId?: string;
  collegeId?: string;
  departmentId?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

