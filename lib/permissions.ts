import { SessionUser } from '@/types'

export const PERMISSIONS = {
  CREATE_PATIENT: 'create-patient',
  READ_DOSSIER: 'read-dossier',
  WRITE_DOSSIER: 'write-dossier',
  URGENCE_ACCESS: 'urgence-access',
  SCAN_QR: 'scan-qr',
  CREATE_USER: 'create-user',
  MANAGE_ROLES: 'manage-roles',
  MANAGE_CENTRES: 'manage-centres',
  MANAGE_SPECIALITES: 'manage-specialites',
  VIEW_LOGS: 'view-logs',
} as const

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export function hasPermission(user: SessionUser, permission: PermissionCode): boolean {
  if (user.niveauAcces === 'SUPERADMIN') return true
  return user.permissions.includes(permission)
}

export function hasAnyPermission(user: SessionUser, permissions: PermissionCode[]): boolean {
  if (user.niveauAcces === 'SUPERADMIN') return true
  return permissions.some((p) => user.permissions.includes(p))
}

export function isSuperAdmin(user: SessionUser): boolean {
  return user.niveauAcces === 'SUPERADMIN'
}

export function isAdminCentre(user: SessionUser): boolean {
  return user.niveauAcces === 'ADMIN_CENTRE'
}

export function isPersonnel(user: SessionUser): boolean {
  return user.niveauAcces === 'PERSONNEL'
}
