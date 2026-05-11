const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

export type LicenseRegisterEntry = {
  licenseNumber: string;
  institutionName: string;
  licenseType: string;
  licensedAt: string;
  status: string;
};

export type AuditEntry = {
  id: string;
  actorId: string;
  actorName: string | null;
  actorRole: string;
  action: string;
  description: string | null;
  createdAt: string;
};

export type AuditEntryFull = AuditEntry & {
  applicationId: string;
  previousState: string | null;
  newState: string | null;
};

export type PaginatedResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
};

export type ApplicationDocument = {
  id: string;
  documentType: string;
  originalName: string;
  mimeType: string;
  fileSizeBytes: number;
  version: number;
  current: boolean;
  uploadStage: string;
  uploadedByName: string | null;
  createdAt: string;
};

type BackendError = {
  error?: {
    message?: string;
  };
};

export function buildApiUrl(endpoint: string) {
  return `${API_BASE_URL}${endpoint}`;
}

export async function readBackendError(response: Response) {
  // Try to parse as JSON first
  let payload;
  try {
    payload = await response.json();
  } catch {
    // If JSON parsing fails, return the text content or a generic message
    const text = await response.text().catch(() => "");
    return text ? `API error: ${text.substring(0, 200)}` : "API request failed (invalid response format)";
  }

  // Handle the expected BackendError structure
  const backendError = payload as BackendError | null;
  if (backendError?.error?.message) {
    return backendError.error.message;
  }

  // If we have a payload but it doesn't match our expected structure,
  // return a meaningful message based on what we received
  if (payload) {
    // If it's a string, return it directly
    if (typeof payload === 'string') {
      return payload;
    }
    // If it's an object with a message field
    if (typeof payload === 'object' && 'message' in payload && payload.message) {
      return String(payload.message);
    }
    // Fallback for other objects
    return JSON.stringify(payload).substring(0, 200);
  }

  // Final fallback
  return "API request failed";
}

export async function requestBackend<T>(
  endpoint: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(buildApiUrl(endpoint), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readBackendError(response));
  }

  return (await response.json()) as T;
}

export async function requestBackendWithToken<T>(
  endpoint: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  return requestBackend<T>(endpoint, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
}

export async function getLicenseRegister() {
  return requestBackend<LicenseRegisterEntry[]>("/public/license-register");
}

export type ApplicationResponse = {
  id: string;
  referenceNumber: string;
  status: string;
  proposedName: string;
  licenseType: string;
  applicant?: string;
  updatedAt: string;
  caseManagerName?: string | null;
  technicalReviewerName?: string | null;
  inspectionOfficerName?: string | null;
  licenseFeePaidAt?: string | null;
};

export type ApplicationDetailResponse = ApplicationResponse & {
  institutionName: string;
  proposedCapitalRwf: number;
  registeredCountry: string;
  foreignInstitution: boolean;
  homeSupervisorName?: string;
  homeSupervisorEmail?: string;
  applicantName: string;
  applicantEmail: string;
  submittedAt?: string;
  licenseNumber?: string;
  licenseIssuedAt?: string;
  slaWorkingDaysTarget: number;
  slaWorkingDaysUsed: number;
  slaClockStartedAt?: string;
  slaClockPausedAt?: string;
  slaPausedReason?: string;
  technicalReviewNotes?: string;
  legalReviewNotes?: string;
  rejectionReason?: string;
  aipGrantedAt?: string;
  aipExpiresAt?: string;
  organizationDeadline?: string;
  caseManagerName?: string;
  technicalReviewerName?: string;
  legalOfficerName?: string;
  inspectionOfficerName?: string;
  inspectionOutcome?: string;
  licenseFeePaidAt?: string;
  licenseIssuedByName?: string;
  infoRequestedReason?: string;
  infoRequestedItems?: string[];
};

export type ApplicationData = ApplicationResponse;

export async function getMyApplications(token: string) {
  return requestBackendWithToken<ApplicationResponse[]>("/applications/my", token);
}

export async function getApplicationDetail(id: string, token: string) {
  return requestBackendWithToken<ApplicationDetailResponse>(`/applications/${id}`, token);
}

export async function createDraftApplication(token: string, data: { proposedName: string, licenseType: string, proposedCapitalRwf: number }) {
  return requestBackendWithToken<ApplicationResponse>("/applications/draft", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function transitionApplication(id: string, action: string, token: string, body?: unknown) {
  return requestBackendWithToken<string>(`/applications/${id}/${action}`, token, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function getCaseManagers(token: string) {
  return requestBackendWithToken<{ id: string, fullName: string }[]>("/applications/case-managers", token);
}

export type FitAndProperAssessmentResponse = {
  id: string;
  individualName: string;
  individualRole: string;
  shareholdingPct: number;
  nationalId: string;
  nationality: string;
  criminalRecordClear: boolean;
  financialHistoryClear: boolean;
  qualificationsAdequate: boolean;
  noConflictOfInterest: boolean;
  interviewConducted: boolean;
  interviewDate: string;
  interviewNotes: string;
  outcome: string;
  outcomeNotes: string;
  assessedAt: string;
};

export async function getFitAndProperAssessments(id: string, token: string) {
  return requestBackendWithToken<FitAndProperAssessmentResponse[]>(`/applications/${id}/fit-and-proper`, token);
}

export async function createFitAndProperAssessment(id: string, token: string, data: { individualName: string, individualRole: string, shareholdingPct?: number, nationalId?: string, nationality?: string }) {
  return requestBackendWithToken<FitAndProperAssessmentResponse>(`/applications/${id}/fit-and-proper`, token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type ApplicationDocumentResponse = {
  id: string;
  documentType: string;
  originalName: string;
  mimeType: string;
  fileSizeBytes: number;
  version: number;
  current: boolean;
  uploadStage: string;
  uploadedByName: string;
  createdAt: string;
};

export async function getDocuments(applicationId: string, token: string) {
  return requestBackendWithToken<ApplicationDocumentResponse[]>(`/applications/${applicationId}/documents`, token);
}

export async function concludeFitAndProperAssessment(appId: string, assessmentId: string, token: string, data: { outcome: string, outcomeNotes: string }) {
  return requestBackendWithToken<void>(`/applications/${appId}/fit-and-proper/${assessmentId}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export type StartReviewRequest = {
  notes?: string;
};

export type CompleteReviewRequest = {
  notes: string;
};

export async function startTechnicalReview(id: string, token: string, request?: StartReviewRequest) {
  return requestBackendWithToken<{ message: string }>(`/applications/${id}/start-technical-review`, token, {
    method: "POST",
    body: request ? JSON.stringify(request) : undefined,
  });
}

export async function completeTechnicalReview(id: string, token: string, request: CompleteReviewRequest) {
  return requestBackendWithToken<{ message: string; status: string }>(`/applications/${id}/complete-technical-review`, token, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export type RequestAdditionalInfoRequest = {
  infoRequested: string[];
  reason?: string;
  returnToState?: string; // UUID of the state to return to
};

export type RespondAdditionalInfoRequest = {
  returnToState?: string;
  responseNotes?: string;
};

export async function requestAdditionalInfo(id: string, token: string, request: RequestAdditionalInfoRequest) {
  return requestBackendWithToken<{ message: string; infoRequested: string[] }>(`/applications/${id}/review/request-info`, token, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function respondToAdditionalInfo(id: string, token: string, request: RespondAdditionalInfoRequest) {
  return requestBackendWithToken<{ message: string; status: string }>(`/applications/${id}/additional-info/respond`, token, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function startLegalReview(id: string, token: string, request?: StartReviewRequest) {
  return requestBackendWithToken<{ message: string }>(`/applications/${id}/start-legal-review`, token, {
    method: "POST",
    body: request ? JSON.stringify(request) : undefined,
  });
}

export async function completeLegalReview(id: string, token: string, request: CompleteReviewRequest) {
  return requestBackendWithToken<{ message: string; status: string }>(`/applications/${id}/complete-legal-review`, token, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export type StartCommitteeDeliberationRequest = {
  notes?: string;
};

export type GrantAipRequest = {
  conditions: ConditionInput[];
  notes?: string;
};

export type ConditionInput = {
  conditionText: string;
  category: string;
  dueDate?: string; // ISO date string
};

export type DenyAipRequest = {
  reason: string;
};

export async function startCommitteeDeliberation(id: string, token: string, request?: StartCommitteeDeliberationRequest) {
  return requestBackendWithToken<{ message: string }>(`/applications/${id}/start-committee-deliberation`, token, {
    method: "POST",
    body: request ? JSON.stringify(request) : undefined,
  });
}

export async function grantApprovalInPrinciple(id: string, token: string, request: GrantAipRequest) {
  return requestBackendWithToken<{
    message: string;
    status: string;
    aipGrantedAt: string;
    aipExpiresAt: string;
    conditionsCount: number;
  }>(`/applications/${id}/grant-approval-in-principle`, token, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function denyApprovalInPrinciple(id: string, token: string, request: DenyAipRequest) {
  return requestBackendWithToken<{ message: string; status: string }>(`/applications/${id}/deny-approval-in-principle`, token, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export type LicenseConditionResponse = {
  id: string;
  conditionText: string;
  category: string;
  fulfilled: boolean;
  fulfilledAt?: string;
  fulfilledByName?: string;
  fulfillmentNote?: string;
  dueDate?: string;
  createdAt: string;
};

export type AddConditionRequest = {
  conditionText: string;
  category: string;
  dueDate?: string;
};

export type FulfillConditionRequest = {
  fulfillmentNote?: string;
  documentId?: string;
};

export async function getLicenseConditions(id: string, token: string) {
  return requestBackendWithToken<LicenseConditionResponse[]>(`/applications/${id}/conditions`, token);
}

export async function addLicenseCondition(id: string, token: string, request: AddConditionRequest) {
  return requestBackendWithToken<LicenseConditionResponse>(`/applications/${id}/conditions`, token, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function fulfillLicenseCondition(appId: string, conditionId: string, token: string, request: FulfillConditionRequest) {
  return requestBackendWithToken<LicenseConditionResponse>(`/applications/${appId}/conditions/${conditionId}/fulfill`, token, {
    method: "PATCH",
    body: JSON.stringify(request),
  });
}

export type ScheduleInspectionRequest = {
  scheduledDate: string; // ISO date string e.g. "2025-06-15"
};

export type SubmitInspectionReportRequest = {
  conductedDate: string;
  premisesVerified: boolean;
  capitalVerified: boolean;
  capitalAmountRwf?: number;
  itSystemsVerified: boolean;
  amlFrameworkOk: boolean;
  staffingAdequate: boolean;
  policyManualsOk: boolean;
  overallOutcome: "PASSED" | "FAILED";
  findings?: string;
};

export type InspectionReportResponse = {
  id: string;
  applicationId: string;
  inspectionOfficerName: string;
  scheduledDate: string;
  conductedDate?: string;
  premisesVerified?: boolean;
  capitalVerified?: boolean;
  capitalAmountRwf?: number;
  itSystemsVerified?: boolean;
  amlFrameworkOk?: boolean;
  staffingAdequate?: boolean;
  policyManualsOk?: boolean;
  overallOutcome?: string;
  findings?: string;
  createdAt: string;
};

export type ConfirmFeePaymentRequest = {
  amountRwf: number;
  paymentReference?: string;
};

export async function requestInspection(id: string, token: string, request: ScheduleInspectionRequest) {
  return requestBackendWithToken<{ message: string; scheduledDate: string }>(`/applications/${id}/request-inspection`, token, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function submitInspectionReport(id: string, token: string, request: SubmitInspectionReportRequest) {
  return requestBackendWithToken<{ message: string; outcome: string; status: string }>(`/applications/${id}/submit-inspection-report`, token, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function confirmFeePayment(id: string, token: string, request: ConfirmFeePaymentRequest) {
  return requestBackendWithToken<{ message: string; licenseFeePaidAt: string }>(`/applications/${id}/confirm-fee-payment`, token, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function issueLicense(id: string, token: string) {
  return requestBackendWithToken<{ message: string; status: string; licenseNumber: string; licenseIssuedAt: string }>(`/applications/${id}/issue-license`, token, {
    method: "POST",
  });
}

export async function getGlobalAuditLog(token: string, page = 0, size = 50) {
  return requestBackendWithToken<PaginatedResponse<AuditEntryFull>>(`/audit/global?page=${page}&size=${size}`, token);
}

export async function getApplicationAuditTrail(id: string, token: string) {
  return requestBackendWithToken<AuditEntryFull[]>(`/audit/applications/${id}`, token);
}

export type UserResponse = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  active: boolean;
};

export async function getAllUsers(token: string) {
  return requestBackendWithToken<UserResponse[]>("/admin/users", token);
}

export async function deactivateUser(userId: string, token: string) {
  return requestBackendWithToken<{ message: string }>(`/admin/users/${userId}/deactivate`, token, {
    method: "POST",
  });
}

export async function reactivateUser(userId: string, token: string) {
  return requestBackendWithToken<{ message: string }>(`/admin/users/${userId}/reactivate`, token, {
    method: "POST",
  });
}