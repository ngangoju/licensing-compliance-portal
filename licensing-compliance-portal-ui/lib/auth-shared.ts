export type UserRole =
  | "APPLICANT"
  | "CASE_MANAGER"
  | "COMPLIANCE_OFFICER"
  | "TECHNICAL_REVIEWER"
  | "FIT_AND_PROPER_OFFICER"
  | "LEGAL_OFFICER"
  | "INSPECTION_OFFICER"
  | "LICENSING_COMMITTEE"
  | "GOVERNOR_DELEGATE"
  | "ADMIN"
  | "AUDITOR";

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  organisation?: string;
};

export const BNR_ROLES: UserRole[] = [
  "CASE_MANAGER",
  "COMPLIANCE_OFFICER",
  "TECHNICAL_REVIEWER",
  "FIT_AND_PROPER_OFFICER",
  "LEGAL_OFFICER",
  "INSPECTION_OFFICER",
  "LICENSING_COMMITTEE",
  "GOVERNOR_DELEGATE",
  "ADMIN",
  "AUDITOR",
];

export function roleHomePath(role: UserRole) {
  return role === "APPLICANT" ? "/applicant/dashboard" : "/bnr/dashboard";
}

export function isBnrRole(role: UserRole) {
  return BNR_ROLES.includes(role);
}
