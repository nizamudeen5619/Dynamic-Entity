export interface EntityPermissions {
  view?: string[];
  edit?: string[];
  delete?: string[];
}

export interface RbacContext {
  userRoles: string[];
  maskedRoles?: string[];
}
