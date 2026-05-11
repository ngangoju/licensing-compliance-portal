"use client";

import { useEffect, useState } from "react";
import {
  getApplicationDetail,
  ApplicationDetailResponse,
  transitionApplication,
  getCaseManagers,
  getFitAndProperAssessments,
  createFitAndProperAssessment,
  concludeFitAndProperAssessment,
  FitAndProperAssessmentResponse,
  completeTechnicalReview,
  requestAdditionalInfo,
  completeLegalReview,
  grantApprovalInPrinciple,
  denyApprovalInPrinciple,
  getLicenseConditions,
  addLicenseCondition,
  fulfillLicenseCondition,
  LicenseConditionResponse,
  ConditionInput,
  requestInspection,
  submitInspectionReport,
  confirmFeePayment,
  issueLicense,
  getDocuments,
  ApplicationDocumentResponse,
} from "@/lib/api";
import { BackButton } from "@/components/ui/BackButton";
import { ReasonModal } from "@/components/ui/ReasonModal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SlaWidget } from "@/components/ui/SlaWidget";
import { PdfPreview } from "@/components/ui/PdfPreview";
import { LICENSE_TYPE_LABELS } from "@/lib/constants";
import { UserRole } from "@/lib/auth-shared";

type CaseManager = { id: string; fullName: string };

function ImagePreview({
  src,
  alt,
  applicationId,
  document
}: {
  src: string;
  alt: string;
  applicationId: string;
  document: ApplicationDocumentResponse;
}) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="text-center p-12 bg-white rounded-lg shadow-xl max-w-md">
        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <h4 className="text-lg font-bold text-[var(--bnr-text-primary)] mb-2">Image Not Available</h4>
        <p className="text-sm text-[var(--bnr-text-secondary)] mb-6">
          The image file could not be loaded. The file may have been removed or is temporarily unavailable.
        </p>
        <a
          href={`/api/applications/${applicationId}/documents/${document.id}/download`}
          target="_blank"
          rel="noreferrer"
          className="btn-primary py-2 px-8 rounded-lg"
        >
          Download File
        </a>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="max-w-full max-h-full object-contain shadow-xl"
      onError={() => setImageError(true)}
    />
  );
}

export function BnrApplicationDetailClient({
  id,
  token,
  initialData,
  userRole,
}: {
  id: string;
  token: string;
  initialData: ApplicationDetailResponse;
  userRole: UserRole;
}) {
  const [appData, setAppData] = useState<ApplicationDetailResponse>(initialData);
  const [caseManagerId, setCaseManagerId] = useState("");
  const [caseManagers, setCaseManagers] = useState<CaseManager[]>([]);

  // Documents
  const [documents, setDocuments] = useState<ApplicationDocumentResponse[]>([]);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ApplicationDocumentResponse | null>(null);

  // F&P state
  const [assessments, setAssessments] = useState<FitAndProperAssessmentResponse[]>([]);
  const [showAddPersonForm, setShowAddPersonForm] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonRole, setNewPersonRole] = useState("");
  const [concludeAssessmentId, setConcludeAssessmentId] = useState<string | null>(null);
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [selectedConditionId, setSelectedConditionId] = useState<string | null>(null);
  const [fulfillmentNote, setFulfillmentNote] = useState("");
  const [fulfillmentDocumentId, setFulfillmentDocumentId] = useState("");
  
  const [concludeOutcome, setConcludeOutcome] = useState<"FIT" | "NOT_FIT">("FIT");
  const [concludeNotes, setConcludeNotes] = useState("");

  // Phase 5: Review panels state
  const [reviewNotes, setReviewNotes] = useState("");
  const [showAdditionalInfoModal, setShowAdditionalInfoModal] = useState(false);
  const [additionalInfoList, setAdditionalInfoList] = useState<string[]>([""]);
  const [additionalInfoReason, setAdditionalInfoReason] = useState("");

  // Phase 5: AIP conditions state
  const [conditions, setConditions] = useState<LicenseConditionResponse[]>([]);
  const [showAddConditionForm, setShowAddConditionForm] = useState(false);
  const [newConditionText, setNewConditionText] = useState("");
  const [newConditionCategory, setNewConditionCategory] = useState("CAPITAL");
  const [newConditionDueDate, setNewConditionDueDate] = useState("");
  const [showGrantAipModal, setShowGrantAipModal] = useState(false);
  const [showDenyAipModal, setShowDenyAipModal] = useState(false);
  const [aipConditions, setAipConditions] = useState<ConditionInput[]>([]);

  // Applicant response to additional info
  const [denyReason, setDenyReason] = useState("");
  
  // Rejection modals
  const [showRejectNameModal, setShowRejectNameModal] = useState(false);
  const [showMarkIncompleteModal, setShowMarkIncompleteModal] = useState(false);
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [showFinalRejectModal, setShowFinalRejectModal] = useState(false);

  // Phase 6: Inspection state
  const [inspectionScheduledDate, setInspectionScheduledDate] = useState("");
  const [showInspectionReportForm, setShowInspectionReportForm] = useState(false);
  const [inspectionConductedDate, setInspectionConductedDate] = useState("");
  const [inspectionPremisesVerified, setInspectionPremisesVerified] = useState(false);
  const [inspectionCapitalVerified, setInspectionCapitalVerified] = useState(false);
  const [inspectionCapitalAmount, setInspectionCapitalAmount] = useState("");
  const [inspectionItSystemsVerified, setInspectionItSystemsVerified] = useState(false);
  const [inspectionAmlFrameworkOk, setInspectionAmlFrameworkOk] = useState(false);
  const [inspectionStaffingAdequate, setInspectionStaffingAdequate] = useState(false);
  const [inspectionPolicyManualsOk, setInspectionPolicyManualsOk] = useState(false);
  const [inspectionOutcome, setInspectionOutcome] = useState<"PASSED" | "FAILED">("PASSED");
  const [inspectionFindings, setInspectionFindings] = useState("");

  // Phase 6: Fee payment state
  const [feeAmount, setFeeAmount] = useState("");
  const [feePaymentReference, setFeePaymentReference] = useState("");

  useEffect(() => {
    async function fetchCaseManagersIfNeeded() {
      if (appData.status === "COMPLETENESS_CHECK") {
        try {
          const cms = await getCaseManagers(token);
          setCaseManagers(cms);
          if (cms.length > 0) setCaseManagerId(cms[0].id);
        } catch (e) {
          console.error(e);
        }
      }
    }
    fetchCaseManagersIfNeeded();
  }, [appData.status, token]);

  useEffect(() => {
    async function fetchAssessmentsIfNeeded() {
      if (appData.status === "FIT_AND_PROPER_ASSESSMENT") {
        try {
          const data = await getFitAndProperAssessments(id, token);
          setAssessments(data);
        } catch (e) {
          console.error(e);
        }
      }
    }
    fetchAssessmentsIfNeeded();
  }, [appData.status, id, token]);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const data = await getDocuments(id, token);
        setDocuments(data);
      } catch (e) {
        console.error("Failed to fetch documents:", e);
      }
    }
    fetchDocuments();
  }, [id, token]);

  useEffect(() => {
    async function fetchConditionsIfNeeded() {
      const phase5Statuses = [
        "TECHNICAL_REVIEW", "LEGAL_REVIEW", "COMMITTEE_DELIBERATION",
        "APPROVAL_IN_PRINCIPLE", "ORGANIZATION_PERIOD", "PRE_LICENSE_INSPECTION",
        "LICENSE_FEE_PENDING"
      ];
      if (phase5Statuses.includes(appData.status) || appData.status === "ADDITIONAL_INFO_REQUESTED") {
        try {
          const data = await getLicenseConditions(id, token);
          setConditions(data);
        } catch (e) {
          console.error(e);
        }
      }
    }
    fetchConditionsIfNeeded();
  }, [appData.status, id, token]);

  const getSlaPercentage = () => {
    return Math.min(100, Math.round((appData.slaWorkingDaysUsed / appData.slaWorkingDaysTarget) * 100));
  };

  const refreshData = async () => {
    const data = await getApplicationDetail(id, token);
    setAppData(data);
  };

  const refreshAssessments = async () => {
    const data = await getFitAndProperAssessments(id, token);
    setAssessments(data);
  };

  const refreshConditions = async () => {
    const data = await getLicenseConditions(id, token);
    setConditions(data);
  };

  const handleAction = async (action: string, payload?: unknown) => {
    try {
      await transitionApplication(id, action, token, payload);
      await refreshData();
      if (action === "start-fit-and-proper" || action === "complete-fit-and-proper") {
        await refreshAssessments();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert("Error: " + err.message);
      } else {
        alert("An unknown error occurred");
      }
    }
  };

  const handleAddPerson = async () => {
    if (!newPersonName.trim() || !newPersonRole.trim()) {
      alert("Name and role are required.");
      return;
    }
    try {
      await createFitAndProperAssessment(id, token, { individualName: newPersonName, individualRole: newPersonRole });
      setNewPersonName("");
      setNewPersonRole("");
      setShowAddPersonForm(false);
      await refreshAssessments();
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleConcludeAssessment = async () => {
    if (!concludeAssessmentId) return;
    try {
      await concludeFitAndProperAssessment(id, concludeAssessmentId, token, { outcome: concludeOutcome, outcomeNotes: concludeNotes });
      setConcludeAssessmentId(null);
      setConcludeOutcome("FIT");
      setConcludeNotes("");
      await refreshAssessments();
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  // Phase 5 handlers
   const handleCompleteTechnicalReview = async () => {
     if (!reviewNotes.trim()) {
       alert("Review notes are required.");
       return;
     }
     try {
       await completeTechnicalReview(id, token, { notes: reviewNotes });
       await refreshData();
       setReviewNotes("");
     } catch (err: unknown) {
       alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
     }
   };

   const handleCompleteLegalReview = async () => {
     if (!reviewNotes.trim()) {
       alert("Review notes are required.");
       return;
     }
     try {
       await completeLegalReview(id, token, { notes: reviewNotes });
       await refreshData();
       setReviewNotes("");
     } catch (err: unknown) {
       alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
     }
   };

   const handleRequestAdditionalInfo = async () => {
     const infoList = additionalInfoList.filter(i => i.trim() !== "");
     if (infoList.length === 0) {
       alert("Please specify at least one item of information requested.");
       return;
     }
     try {
       await requestAdditionalInfo(id, token, {
         infoRequested: infoList,
         reason: additionalInfoReason,
         returnToState: undefined
       });
       setShowAdditionalInfoModal(false);
       setAdditionalInfoList([""]);
       setAdditionalInfoReason("");
       await refreshData();
     } catch (err: unknown) {
       alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
     }
   };


  const handleGrantAip = async () => {
    if (aipConditions.length === 0) {
      alert("At least one license condition is required for AIP.");
      return;
    }
    try {
      await grantApprovalInPrinciple(id, token, { conditions: aipConditions, notes: reviewNotes });
      setShowGrantAipModal(false);
      setAipConditions([]);
      setReviewNotes("");
      await refreshData();
      await refreshConditions();
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleDenyAip = async () => {
    if (!denyReason.trim()) {
      alert("A denial reason is required.");
      return;
    }
    try {
      await denyApprovalInPrinciple(id, token, { reason: denyReason });
      setShowDenyAipModal(false);
      setDenyReason("");
      await refreshData();
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  // Phase 6: Inspection handlers
  const handleRequestInspection = async () => {
    if (!inspectionScheduledDate) {
      alert("Please select a scheduled date for the inspection.");
      return;
    }
    try {
      await requestInspection(id, token, { scheduledDate: inspectionScheduledDate });
      setInspectionScheduledDate("");
      await refreshData();
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleSubmitInspectionReport = async () => {
    try {
      await submitInspectionReport(id, token, {
        conductedDate: inspectionConductedDate,
        premisesVerified: inspectionPremisesVerified,
        capitalVerified: inspectionCapitalVerified,
        capitalAmountRwf: inspectionCapitalAmount ? Number(inspectionCapitalAmount) : undefined,
        itSystemsVerified: inspectionItSystemsVerified,
        amlFrameworkOk: inspectionAmlFrameworkOk,
        staffingAdequate: inspectionStaffingAdequate,
        policyManualsOk: inspectionPolicyManualsOk,
        overallOutcome: inspectionOutcome,
        findings: inspectionFindings || undefined
      });
      setShowInspectionReportForm(false);
      // Reset form
      setInspectionConductedDate("");
      setInspectionPremisesVerified(false);
      setInspectionCapitalVerified(false);
      setInspectionCapitalAmount("");
      setInspectionItSystemsVerified(false);
      setInspectionAmlFrameworkOk(false);
      setInspectionStaffingAdequate(false);
      setInspectionPolicyManualsOk(false);
      setInspectionOutcome("PASSED");
      setInspectionFindings("");
      await refreshData();
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleConfirmFeePayment = async () => {
    if (!feeAmount) {
      alert("Please enter the fee amount.");
      return;
    }
    try {
      await confirmFeePayment(id, token, {
        amountRwf: Number(feeAmount),
        paymentReference: feePaymentReference || undefined
      });
      setFeeAmount("");
      setFeePaymentReference("");
      await refreshData();
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleIssueLicense = async () => {
    try {
      const result = await issueLicense(id, token);
      alert(`License issued successfully!\nLicense Number: ${result.licenseNumber}`);
      await refreshData();
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleAddCondition = async () => {
    if (!newConditionText.trim()) {
      alert("Condition text is required.");
      return;
    }
    try {
      await addLicenseCondition(id, token, {
        conditionText: newConditionText,
        category: newConditionCategory,
        dueDate: newConditionDueDate || undefined
      });
      setNewConditionText("");
      setNewConditionCategory("CAPITAL");
      setNewConditionDueDate("");
      setShowAddConditionForm(false);
      await refreshConditions();
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleFulfillCondition = async (conditionId: string, note?: string, documentId?: string) => {
    try {
      await fulfillLicenseCondition(id, conditionId, token, { fulfillmentNote: note, documentId });
      await refreshConditions();
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const addAipCondition = () => {
    setAipConditions([...aipConditions, { conditionText: "", category: "CAPITAL" }]);
  };

  const updateAipCondition = (index: number, field: keyof ConditionInput, value: string) => {
    const updated = [...aipConditions];
    updated[index] = { ...updated[index], [field]: value };
    setAipConditions(updated);
  };

  const removeAipCondition = (index: number) => {
    setAipConditions(aipConditions.filter((_, i) => i !== index));
  };

  const allFit = assessments.length > 0 && assessments.every(a => a.outcome === "FIT");

  return (
    <div className="space-y-6 max-w-6xl">
      <BackButton label="Back to Application Queue" href="/bnr/applications" />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--bnr-text-primary)]">
            {appData.proposedName || appData.institutionName}
          </h1>
          <div className="mt-2 flex items-center gap-3 text-[var(--bnr-text-secondary)]">
            <span>{appData.referenceNumber}</span>
            <span>&bull;</span>
            <span>{LICENSE_TYPE_LABELS[appData.licenseType] || appData.licenseType.replace(/_/g, " ")}</span>
            <span>&bull;</span>
            <StatusBadge status={appData.status} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowDocumentsModal(true)} className="btn-secondary">View Documents</button>
          <button className="btn-secondary">Audit Trail</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="surface-panel rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[var(--bnr-text-primary)] mb-4">Application Details</h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-[var(--bnr-text-secondary)] font-medium">Applicant Name</p>
                <p className="mt-1 text-[var(--bnr-text-primary)]">{appData.applicantName}</p>
              </div>
              <div>
                <p className="text-[var(--bnr-text-secondary)] font-medium">Applicant Email</p>
                <p className="mt-1 text-[var(--bnr-text-primary)]">{appData.applicantEmail}</p>
              </div>
              <div>
                <p className="text-[var(--bnr-text-secondary)] font-medium">Proposed Capital (RWF)</p>
                <p className="mt-1 text-[var(--bnr-text-primary)]">{new Intl.NumberFormat('en-RW', { style:'currency', currency:'RWF', maximumFractionDigits:0 }).format(appData.proposedCapitalRwf)}</p>
              </div>
              <div>
                <p className="text-[var(--bnr-text-secondary)] font-medium">Registered Country</p>
                <p className="mt-1 text-[var(--bnr-text-primary)]">{appData.registeredCountry}</p>
              </div>
              {appData.foreignInstitution && (
                <>
                  <div>
                    <p className="text-[var(--bnr-text-secondary)] font-medium">Home Supervisor</p>
                    <p className="mt-1 text-[var(--bnr-text-primary)]">{appData.homeSupervisorName}</p>
                  </div>
                  <div>
                    <p className="text-[var(--bnr-text-secondary)] font-medium">Supervisor Email</p>
                    <p className="mt-1 text-[var(--bnr-text-primary)]">{appData.homeSupervisorEmail}</p>
                  </div>
                </>
              )}
              {/* Phase 5: Review team info */}
              {appData.technicalReviewerName && (
                <div>
                  <p className="text-[var(--bnr-text-secondary)] font-medium">Technical Reviewer</p>
                  <p className="mt-1 text-[var(--bnr-text-primary)]">{appData.technicalReviewerName}</p>
                </div>
              )}
              {appData.legalOfficerName && (
                <div>
                  <p className="text-[var(--bnr-text-secondary)] font-medium">Legal Officer</p>
                  <p className="mt-1 text-[var(--bnr-text-primary)]">{appData.legalOfficerName}</p>
                </div>
              )}
              {/* Phase 5: AIP info */}
              {appData.aipGrantedAt && (
                <>
                  <div>
                    <p className="text-[var(--bnr-text-secondary)] font-medium">AIP Granted</p>
                    <p className="mt-1 text-[var(--bnr-text-primary)]">{new Intl.DateTimeFormat('en-RW', { day:'2-digit', month:'short', year:'numeric' }).format(new Date(appData.aipGrantedAt))}</p>
                  </div>
                  <div>
                    <p className="text-[var(--bnr-text-secondary)] font-medium">AIP Expires</p>
                    <p className="mt-1 text-[var(--bnr-text-primary)]">{new Intl.DateTimeFormat('en-RW', { day:'2-digit', month:'short', year:'numeric' }).format(new Date(appData.aipExpiresAt!))}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <SlaWidget 
            targetDays={appData.slaWorkingDaysTarget} 
            usedDays={appData.slaWorkingDaysUsed} 
            isPaused={appData.status === "INCOMPLETE" || appData.status === "ADDITIONAL_INFO_REQUESTED"}
            pauseReason={appData.slaPausedReason}
          />

          {/* F&P Assessment Panel */}
          {appData.status === "FIT_AND_PROPER_ASSESSMENT" && (
            <div className="surface-panel rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--bnr-text-primary)]">Fit & Proper Assessments</h2>
                <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded ${allFit ? "bg-emerald-100 text-emerald-700" : assessments.length === 0 ? "bg-stone-100 text-stone-600" : "bg-amber-100 text-amber-700"}`}>
                  {allFit ? "All FIT" : assessments.length === 0 ? "No individuals" : "Pending"}
                </span>
              </div>

              {assessments.length === 0 ? (
                <p className="text-sm text-[var(--bnr-text-secondary)] mb-4">
                  No individuals have been added yet. Add directors, senior managers, and significant shareholders.
                </p>
              ) : (
                <div className="space-y-3 mb-4">
                  {assessments.map(a => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-white p-4">
                      <div>
                        <p className="font-semibold text-[var(--bnr-text-primary)]">{a.individualName}</p>
                        <p className="text-xs text-[var(--bnr-text-secondary)]">{a.individualRole}</p>
                        {a.shareholdingPct > 0 && (
                          <p className="text-xs text-[var(--bnr-text-secondary)]">{a.shareholdingPct}% shareholding</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
                          a.outcome === "FIT" ? "bg-emerald-100 text-emerald-700" :
                          a.outcome === "NOT_FIT" ? "bg-red-100 text-red-700" :
                          "bg-stone-100 text-stone-500"
                        }`}>
                          {a.outcome}
                        </span>
                        {(userRole === "FIT_AND_PROPER_OFFICER" || userRole === "ADMIN") && (
                          <button
                            onClick={() => { setConcludeAssessmentId(a.id); setConcludeOutcome("FIT"); setConcludeNotes(""); }}
                            className="btn-secondary text-xs py-1 px-3 rounded-lg"
                          >
                            Conclude
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(userRole === "FIT_AND_PROPER_OFFICER" || userRole === "ADMIN") && (
                showAddPersonForm ? (
                  <div className="space-y-3 rounded-lg border border-[var(--border)] bg-white p-4">
                    <p className="text-sm font-semibold text-[var(--bnr-text-primary)]">Add Individual</p>
                    <input type="text" placeholder="Full name" value={newPersonName} onChange={e => setNewPersonName(e.target.value)} className="input-field w-full text-sm" />
                    <input type="text" placeholder="Role (e.g., DIRECTOR, CEO, SHAREHOLDER_5PCT)" value={newPersonRole} onChange={e => setNewPersonRole(e.target.value)} className="input-field w-full text-sm" />
                    <div className="flex gap-2">
                      <button onClick={handleAddPerson} className="btn-primary text-sm py-1.5 px-4 rounded-lg">Add</button>
                      <button onClick={() => { setShowAddPersonForm(false); setNewPersonName(""); setNewPersonRole(""); }} className="btn-secondary text-sm py-1.5 px-4 rounded-lg">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAddPersonForm(true)} className="btn-secondary text-sm py-2 px-4 rounded-lg">
                    + Add Individual
                  </button>
                )
              )}

              {concludeAssessmentId && (userRole === "FIT_AND_PROPER_OFFICER" || userRole === "ADMIN") && (
                <div className="mt-4 space-y-3 rounded-lg border-2 border-[var(--bnr-brown)] bg-[var(--bnr-cream-light)] p-4">
                  <p className="text-sm font-bold text-[var(--bnr-text-primary)]">Conclude Assessment</p>
                  <div className="flex gap-3">
                    <button onClick={() => setConcludeOutcome("FIT")} className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${concludeOutcome === "FIT" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-[var(--bnr-text-secondary)] border-stone-200 hover:border-emerald-400"}`}>
                      FIT
                    </button>
                    <button onClick={() => setConcludeOutcome("NOT_FIT")} className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${concludeOutcome === "NOT_FIT" ? "bg-red-600 text-white border-red-600" : "bg-white text-[var(--bnr-text-secondary)] border-stone-200 hover:border-red-400"}`}>
                      NOT FIT
                    </button>
                  </div>
                  <textarea placeholder="Outcome notes (required)" value={concludeNotes} onChange={e => setConcludeNotes(e.target.value)} className="input-field w-full text-sm" rows={3} />
                  <div className="flex gap-2">
                    <button onClick={handleConcludeAssessment} className="btn-primary text-sm py-1.5 px-4 rounded-lg">Confirm</button>
                    <button onClick={() => setConcludeAssessmentId(null)} className="btn-secondary text-sm py-1.5 px-4 rounded-lg">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Phase 5: Technical Review Panel */}
          {appData.status === "TECHNICAL_REVIEW" && (
            <div className="surface-panel rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--bnr-text-primary)]">Technical Review</h2>
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded bg-orange-100 text-orange-700">
                  In Progress
                </span>
              </div>
              {appData.technicalReviewNotes && (
                <div className="mb-4 p-3 rounded-lg bg-stone-50 border border-stone-200 text-sm">
                  <p className="font-medium text-stone-700 mb-1">Previous Review Notes:</p>
                  <p className="text-stone-600">{appData.technicalReviewNotes}</p>
                </div>
              )}
              {(userRole === "TECHNICAL_REVIEWER" || userRole === "ADMIN") ? (
                <div className="space-y-3">
                  <textarea
                    placeholder="Technical review notes (business plan assessment, capital adequacy, risk management, IT systems, AML/CFT framework)..."
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    className="input-field w-full text-sm"
                    rows={5}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowRequestInfoModal(true)} className="btn-secondary text-sm py-2 px-4 rounded-lg">
                      Request Additional Info
                    </button>
                    <button onClick={handleCompleteTechnicalReview} className="btn-primary text-sm py-2 px-4 rounded-lg">
                      Complete Review &rarr; Legal Review
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--bnr-text-secondary)] italic">
                  Review is being conducted by the Technical Reviewer.
                </p>
              )}
            </div>
          )}

          {/* Phase 5: Legal Review Panel */}
          {appData.status === "LEGAL_REVIEW" && (
            <div className="surface-panel rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--bnr-text-primary)]">Legal Review</h2>
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded bg-cyan-100 text-cyan-700">
                  In Progress
                </span>
              </div>
              {appData.legalReviewNotes && (
                <div className="mb-4 p-3 rounded-lg bg-stone-50 border border-stone-200 text-sm">
                  <p className="font-medium text-stone-700 mb-1">Previous Review Notes:</p>
                  <p className="text-stone-600">{appData.legalReviewNotes}</p>
                </div>
              )}
              {appData.technicalReviewNotes && (
                <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200 text-sm">
                  <p className="font-medium text-orange-700 mb-1">Technical Review Notes:</p>
                  <p className="text-orange-600">{appData.technicalReviewNotes}</p>
                </div>
              )}
              {(userRole === "LEGAL_OFFICER" || userRole === "ADMIN") ? (
                <div className="space-y-3">
                  <textarea
                    placeholder="Legal review notes (articles of incorporation, governance charter, shareholder agreements, bylaws compliance)..."
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    className="input-field w-full text-sm"
                    rows={5}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowRequestInfoModal(true)} className="btn-secondary text-sm py-2 px-4 rounded-lg">
                      Request Additional Info
                    </button>
                    <button onClick={handleCompleteLegalReview} className="btn-primary text-sm py-2 px-4 rounded-lg">
                      Complete Review &rarr; Committee
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--bnr-text-secondary)] italic">
                  Review is being conducted by the Legal Officer.
                </p>
              )}
            </div>
          )}

          {/* Phase 5: Additional Info Requested - Status Display */}
          {appData.status === "ADDITIONAL_INFO_REQUESTED" && (
            <div className="surface-panel rounded-lg p-6 border-2 border-amber-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--bnr-text-primary)]">Additional Information Requested</h2>
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded bg-amber-100 text-amber-700">
                  Awaiting Response
                </span>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Notice:</strong> The applicant has been requested to provide additional information. The SLA clock is currently paused.
                </p>
              </div>
              {appData.infoRequestedReason && (
                <div className="mb-4 p-3 rounded-lg bg-stone-50 border border-stone-200 text-sm">
                  <p className="font-medium text-stone-700 mb-1">Information Requested:</p>
                  <p className="text-stone-600">{appData.infoRequestedReason}</p>
                  {appData.infoRequestedItems && appData.infoRequestedItems.length > 0 && (
                    <ul className="mt-2 list-disc list-inside text-xs text-stone-500">
                      {appData.infoRequestedItems.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Phase 5: Committee Deliberation Panel */}
          {appData.status === "COMMITTEE_DELIBERATION" && (
            <div className="surface-panel rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--bnr-text-primary)]">Committee Deliberation</h2>
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded bg-pink-100 text-pink-700">
                  Under Review
                </span>
              </div>
              {(appData.technicalReviewNotes || appData.legalReviewNotes) && (
                <div className="mb-4 space-y-3">
                  {appData.technicalReviewNotes && (
                    <div className="p-3 rounded-lg bg-[var(--bnr-cream-light)] border-l-3 border-[var(--s-review)] text-sm">
                      <p className="font-medium text-[var(--bnr-text-primary)] mb-1">Technical Review:</p>
                      <p className="text-[var(--bnr-text-secondary)]">{appData.technicalReviewNotes}</p>
                    </div>
                  )}
                  {appData.legalReviewNotes && (
                    <div className="p-3 rounded-lg bg-[var(--bnr-cream-light)] border-l-3 border-[var(--s-legal)] text-sm">
                      <p className="font-medium text-[var(--bnr-text-primary)] mb-1">Legal Review:</p>
                      <p className="text-[var(--bnr-text-secondary)]">{appData.legalReviewNotes}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-3">
                {!showGrantAipModal && (
                  <textarea
                    placeholder="Committee notes or deliberation summary..."
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    className="input-field w-full text-sm !rounded-[4px]"
                    rows={3}
                  />
                )}
                {!showGrantAipModal && (
                  <div className="flex gap-3">
                    <button onClick={() => setShowDenyAipModal(true)} className="btn-secondary text-sm py-2 px-4 !rounded-[4px] bg-[#DC2626] text-white border-none">
                      Deny AIP
                    </button>
                    <button onClick={() => setShowGrantAipModal(true)} className="btn-secondary text-sm py-2 px-4 !rounded-[4px] bg-[var(--bnr-brown)] text-white border-none">
                      Grant AIP with Conditions
                    </button>
                  </div>
                )}
              </div>

              {/* Grant AIP Modal */}
              {showGrantAipModal && (
                <div className="mt-4 p-4 rounded-[8px] border border-[#E8DCC8] bg-[var(--bnr-cream-light)] space-y-3">
                  <p className="font-bold text-[var(--bnr-text-primary)]">Grant Approval in Principle</p>
                  <p className="text-sm text-[var(--bnr-text-secondary)]">Add the license conditions that the applicant must fulfill before the final license is issued.</p>
                  {aipConditions.map((cond, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <input
                        type="text"
                        placeholder="Condition text..."
                        value={cond.conditionText}
                        onChange={e => updateAipCondition(idx, "conditionText", e.target.value)}
                        className="input-field flex-1 text-sm !rounded-[4px]"
                      />
                      <select
                        value={cond.category}
                        onChange={e => updateAipCondition(idx, "category", e.target.value)}
                        className="input-field w-32 text-sm bg-white !rounded-[4px]"
                      >
                        <option value="CAPITAL">Capital</option>
                        <option value="GOVERNANCE">Governance</option>
                        <option value="IT">IT</option>
                        <option value="PREMISES">Premises</option>
                        <option value="AML">AML</option>
                        <option value="OTHER">Other</option>
                      </select>
                      <button onClick={() => removeAipCondition(idx)} className="btn-icon p-2 !text-[#DC2626] border-none bg-none shadow-none">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  ))}
                  <button onClick={addAipCondition} className="btn-secondary text-sm py-1.5 px-3 !rounded-[4px]">
                    + Add Condition
                  </button>
                  <textarea
                    placeholder="Grant notes..."
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    className="input-field w-full text-sm !rounded-[4px]"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleGrantAip} className="btn-primary text-sm py-2 px-4 !rounded-[4px] bg-[var(--bnr-brown)] hover:bg-[var(--bnr-brown-dark)] text-white border-none">
                      Confirm AIP Grant
                    </button>
                    <button onClick={() => { setShowGrantAipModal(false); setAipConditions([]); }} className="btn-secondary text-sm py-2 px-4 !rounded-[4px]">Cancel</button>
                  </div>
                </div>
              )}

              {/* Deny AIP Modal */}
              {showDenyAipModal && (
                <div className="mt-4 p-4 rounded-lg border-2 border-red-300 bg-red-50 space-y-3">
                  <p className="font-bold text-red-700">Deny Approval in Principle</p>
                  <p className="text-sm text-red-600">This is a terminal decision. The application will be marked as rejected.</p>
                  <textarea
                    placeholder="Rejection reason (required for appeal process)..."
                    value={denyReason}
                    onChange={e => setDenyReason(e.target.value)}
                    className="input-field w-full text-sm"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleDenyAip} className="btn-primary text-sm py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700">
                      Confirm Denial
                    </button>
                    <button onClick={() => { setShowDenyAipModal(false); setDenyReason(""); }} className="btn-secondary text-sm py-2 px-4 rounded-lg">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Phase 5: Approval in Principle Panel */}
          {appData.status === "APPROVAL_IN_PRINCIPLE" && (
            <div className="surface-panel rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--bnr-text-primary)]">Approval in Principle</h2>
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded bg-violet-100 text-violet-700">
                  AIP Granted
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-violet-50 border border-violet-200">
                  <p className="text-xs text-violet-600 font-medium">AIP Granted</p>
                  <p className="text-lg font-bold text-violet-700">{appData.aipGrantedAt ? new Intl.DateTimeFormat('en-RW', { day:'2-digit', month:'short', year:'numeric' }).format(new Date(appData.aipGrantedAt)) : "N/A"}</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-600 font-medium">Expires</p>
                  <p className="text-lg font-bold text-amber-700">{appData.aipExpiresAt ? new Intl.DateTimeFormat('en-RW', { day:'2-digit', month:'short', year:'numeric' }).format(new Date(appData.aipExpiresAt)) : "N/A"}</p>
                </div>
              </div>
              <p className="text-sm text-[var(--bnr-text-secondary)] mb-4">
                The applicant must fulfill all conditions below within the organization period before the final license can be issued.
              </p>

              {/* License Conditions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[var(--bnr-text-primary)]">License Conditions ({conditions.filter(c => c.fulfilled).length}/{conditions.length} fulfilled)</h3>
                  <button onClick={() => setShowAddConditionForm(!showAddConditionForm)} className="btn-secondary text-xs py-1.5 px-3 rounded-lg">
                    + Add
                  </button>
                </div>
                {showAddConditionForm && (
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-white space-y-2">
                    <input type="text" placeholder="Condition text..." value={newConditionText} onChange={e => setNewConditionText(e.target.value)} className="input-field w-full text-sm" />
                    <div className="flex gap-2">
                      <select value={newConditionCategory} onChange={e => setNewConditionCategory(e.target.value)} className="input-field flex-1 text-sm bg-white">
                        <option value="CAPITAL">Capital</option>
                        <option value="GOVERNANCE">Governance</option>
                        <option value="IT">IT</option>
                        <option value="PREMISES">Premises</option>
                        <option value="AML">AML</option>
                        <option value="OTHER">Other</option>
                      </select>
                      <input type="date" placeholder="Due date" value={newConditionDueDate} onChange={e => setNewConditionDueDate(e.target.value)} className="input-field flex-1 text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAddCondition} className="btn-primary text-xs py-1.5 px-3 rounded-lg">Add Condition</button>
                      <button onClick={() => setShowAddConditionForm(false)} className="btn-secondary text-xs py-1.5 px-3 rounded-lg">Cancel</button>
                    </div>
                  </div>
                )}
                {conditions.map(cond => (
                  <div key={cond.id} className={`flex items-start justify-between p-3 rounded-lg border ${cond.fulfilled ? "bg-emerald-50 border-emerald-200" : "bg-white border-[var(--border)]"}`}>
                    <div>
                      <p className={`text-sm font-medium ${cond.fulfilled ? "text-emerald-700 line-through" : "text-[var(--bnr-text-primary)]"}`}>
                        {cond.conditionText}
                      </p>
                      <p className="text-xs text-[var(--bnr-text-secondary)]">
                        [{cond.category}] {cond.dueDate && `Due: ${new Intl.DateTimeFormat('en-RW', { day:'2-digit', month:'short', year:'numeric' }).format(new Date(cond.dueDate))}`}
                      </p>
                      {cond.fulfilled && cond.fulfillmentNote && (
                        <p className="text-xs text-emerald-600 mt-1">Note: {cond.fulfillmentNote}</p>
                      )}
                    </div>
                    {!cond.fulfilled && (
                      <button 
                        onClick={() => {
                          setSelectedConditionId(cond.id);
                          setShowFulfillModal(true);
                          setFulfillmentNote("");
                          setFulfillmentDocumentId("");
                        }} 
                        className="btn-secondary text-xs py-1 px-2 rounded-lg"
                      >
                        Mark Fulfilled
                      </button>
                    )}
                    {cond.fulfilled && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">Fulfilled</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phase 5: Organization Period Panel */}
          {appData.status === "ORGANIZATION_PERIOD" && (
            <div className="surface-panel rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--bnr-text-primary)]">Organization Period</h2>
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded bg-fuchsia-100 text-fuchsia-700">
                  In Progress
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-fuchsia-50 border border-fuchsia-200">
                  <p className="text-xs text-fuchsia-600 font-medium">Organization Deadline</p>
                  <p className="text-lg font-bold text-fuchsia-700">{appData.organizationDeadline ? new Intl.DateTimeFormat('en-RW', { day:'2-digit', month:'short', year:'numeric' }).format(new Date(appData.organizationDeadline)) : "N/A"}</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-600 font-medium">Days Remaining</p>
                  <p className="text-lg font-bold text-amber-700">
                    {appData.organizationDeadline ? Math.max(0, Math.ceil((new Date(appData.organizationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : "N/A"}
                  </p>
                </div>
              </div>
              <p className="text-sm text-[var(--bnr-text-secondary)]">
                The applicant is setting up operations. All license conditions must be fulfilled and verified on-site before the pre-license inspection.
              </p>

              {/* License Conditions Progress */}
              {conditions.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-[var(--bnr-text-primary)] mb-2">Conditions Progress</h3>
                  <div className="w-full bg-stone-200 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${(conditions.filter(c => c.fulfilled).length / conditions.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--bnr-text-secondary)] mt-1">{conditions.filter(c => c.fulfilled).length} of {conditions.length} conditions fulfilled</p>
                </div>
              )}
            </div>
          )}

          {/* Phase 5: Rejection Notice */}
          {appData.status === "REJECTED" && (
            <div className="surface-panel rounded-lg p-6 border-2 border-red-300">
              <h2 className="text-lg font-semibold text-red-700 mb-4">Application Rejected</h2>
              {appData.rejectionReason && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm font-medium text-red-700 mb-1">Rejection Reason:</p>
                  <p className="text-sm text-red-600">{appData.rejectionReason}</p>
                </div>
              )}
            </div>
          )}

          {/* Phase 6: Pre-License Inspection Panel */}
          {appData.status === "PRE_LICENSE_INSPECTION" && (
            <div className="surface-panel rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--bnr-text-primary)]">Pre-License Inspection</h2>
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded bg-blue-100 text-blue-700">
                  Scheduled
                </span>
              </div>
              <p className="text-sm text-[var(--bnr-text-secondary)] mb-4">
                The inspection officer will verify that the organization has met all conditions and is ready for licensing.
              </p>
              {appData.inspectionOfficerName && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 mb-4">
                  <p className="text-xs text-blue-600 font-medium">Inspection Officer</p>
                  <p className="text-sm font-bold text-blue-700">{appData.inspectionOfficerName}</p>
                </div>
              )}
              {conditions.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-[var(--bnr-text-primary)] mb-2">Conditions Checklist</h3>
                  <div className="space-y-2">
                    {conditions.map(cond => (
                      <div key={cond.id} className="flex items-center gap-2 p-2 rounded-lg bg-stone-50">
                        {cond.fulfilled ? (
                          <span className="text-emerald-500">✓</span>
                        ) : (
                          <span className="text-red-400">✗</span>
                        )}
                        <span className={`text-sm ${cond.fulfilled ? "line-through text-stone-400" : "text-stone-700"}`}>
                          {cond.conditionText}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Phase 6: Inspection Failed Panel */}
          {appData.status === "INSPECTION_FAILED" && (
            <div className="surface-panel rounded-lg p-6 border-2 border-red-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-red-700">Inspection Failed</h2>
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded bg-red-100 text-red-700">
                  Failed
                </span>
              </div>
              <p className="text-sm text-[var(--bnr-text-secondary)] mb-4">
                The pre-license inspection found issues that must be addressed before re-inspection.
              </p>
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-600 font-medium">Recommended Action</p>
                <p className="text-sm text-amber-700">The applicant must address the issues and request a new inspection once ready.</p>
              </div>
            </div>
          )}

          {/* Phase 6: License Fee Pending Panel */}
          {appData.status === "LICENSE_FEE_PENDING" && (
            <div className="surface-panel rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--bnr-text-primary)]">License Fee Payment</h2>
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded bg-violet-100 text-violet-700">
                  Awaiting Payment
                </span>
              </div>
              <p className="text-sm text-[var(--bnr-text-secondary)] mb-4">
                Inspection passed. The final license fee must be paid before the license can be issued.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-violet-50 border border-violet-200">
                  <p className="text-xs text-violet-600 font-medium">Next Step</p>
                  <p className="text-sm font-bold text-violet-700">Confirm Fee Payment</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-xs text-emerald-600 font-medium">Final Action</p>
                  <p className="text-sm font-bold text-emerald-700">License Issuance</p>
                </div>
              </div>
            </div>
          )}

          {/* Phase 6: Licensed Panel */}
          {appData.status === "LICENSED" && (
            <div className="surface-panel rounded-lg p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-emerald-700">🎉 License Issued!</h2>
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                  Licensed
                </span>
              </div>
              <div className="p-4 rounded-lg bg-white border border-emerald-200 mb-4">
                <p className="text-xs text-emerald-600 font-medium mb-1">License Number</p>
                <p className="text-2xl font-bold text-emerald-700">{appData.licenseNumber || "N/A"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-xs text-emerald-600 font-medium">Institution</p>
                  <p className="text-sm font-bold text-emerald-700">{appData.institutionName}</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-xs text-emerald-600 font-medium">Issued By</p>
                  <p className="text-sm font-bold text-emerald-700">{appData.licenseIssuedByName || "BNR"}</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-xs text-emerald-600 font-medium">License Type</p>
                  <p className="text-sm font-bold text-emerald-700">{appData.licenseType?.replace(/_/g, " ")}</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-xs text-emerald-600 font-medium">Issue Date</p>
                  <p className="text-sm font-bold text-emerald-700">
                    {appData.licenseIssuedAt ? new Intl.DateTimeFormat('en-RW', { day:'2-digit', month:'short', year:'numeric' }).format(new Date(appData.licenseIssuedAt)) : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Phase 6: AIP Expired Panel */}
          {appData.status === "AIP_EXPIRED" && (
            <div className="surface-panel rounded-lg p-6 border-2 border-stone-300">
              <h2 className="text-lg font-semibold text-stone-700 mb-4">AIP Expired</h2>
              <p className="text-sm text-[var(--bnr-text-secondary)]">
                The Approval in Principle has expired. The applicant must reapply if they wish to continue.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* SLA Widget */}
          {appData.slaClockStartedAt && (
            <div className="surface-panel rounded-lg p-6 border-t-4 border-[var(--bnr-brown)]">
              <h3 className="text-sm uppercase tracking-wider text-[var(--bnr-text-secondary)] font-semibold mb-3">SLA Tracking</h3>
              <div className="mb-2 flex justify-between text-sm font-medium">
                <span className="text-[var(--bnr-text-primary)]">{appData.slaWorkingDaysUsed} Days Used</span>
                <span className="text-[var(--bnr-text-secondary)]">{appData.slaWorkingDaysTarget} Target</span>
              </div>
              <div className="w-full bg-[var(--muted)] rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full ${getSlaPercentage() > 80 ? "bg-red-500" : getSlaPercentage() > 50 ? "bg-amber-500" : "bg-green-500"}`}
                  style={{ width: `${getSlaPercentage()}%` }}
                ></div>
              </div>
              {appData.slaClockPausedAt && (
                <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
                  <span className="font-semibold block">Clock Paused</span>
                  {appData.slaPausedReason}
                </div>
              )}
            </div>
          )}

          {/* Workflow Action Panel */}
          <div className="surface-panel rounded-lg p-6">
            <h3 className="text-sm uppercase tracking-wider text-[var(--bnr-text-secondary)] font-semibold mb-3">Workflow Action</h3>

            {/* NAME_APPROVAL_PENDING: Compliance Officer Only */}
            {appData.status === "NAME_APPROVAL_PENDING" ? (
              (userRole === "COMPLIANCE_OFFICER" || userRole === "ADMIN") ? (
                <div className="space-y-3">
                  <button onClick={() => handleAction("approve-name")} className="w-full btn-primary py-2 text-sm justify-center rounded-lg font-medium bg-green-600 hover:bg-green-700">
                    Approve Name
                  </button>
                  <button onClick={() => setShowRejectNameModal(true)} className="w-full btn-secondary py-2 text-sm justify-center rounded-lg font-medium !text-red-600 !border-red-200 hover:!bg-red-50">
                    Reject Name
                  </button>
                </div>
              ) : (
                <p className="text-sm text-[var(--bnr-text-secondary)]">Awaiting Compliance Officer review.</p>
              )
            ) : /* SUBMITTED: Compliance Officer Only */
            appData.status === "SUBMITTED" ? (
              (userRole === "COMPLIANCE_OFFICER" || userRole === "ADMIN") ? (
                <div className="space-y-3">
                  <button onClick={() => handleAction("start-completeness-check")} className="w-full btn-primary py-2 text-sm justify-center rounded-lg font-medium">
                    Begin Completeness Check
                  </button>
                </div>
              ) : (
                <p className="text-sm text-[var(--bnr-text-secondary)]">Awaiting Compliance Officer to start completeness check.</p>
              )
            ) : /* COMPLETENESS_CHECK: Compliance Officer Only */
            appData.status === "COMPLETENESS_CHECK" ? (
              (userRole === "COMPLIANCE_OFFICER" || userRole === "ADMIN") ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--bnr-text-secondary)] mb-2">Check documentation completeness.</p>
                  <button onClick={() => setShowMarkIncompleteModal(true)} className="w-full btn-secondary py-2 text-sm justify-center rounded-lg font-medium !text-red-600 !border-red-200 hover:!bg-red-50">
                    Mark Incomplete
                  </button>
                  <div className="mt-4 border-t pt-4">
                    <label className="block text-sm font-medium text-[var(--bnr-text-secondary)] mb-1">Assign Case Manager</label>
                    <select value={caseManagerId} onChange={e => setCaseManagerId(e.target.value)} className="w-full input-field mb-2 bg-white">
                      {caseManagers.map(cm => <option key={cm.id} value={cm.id}>{cm.fullName}</option>)}
                    </select>
                    <button onClick={() => handleAction("assign-case-manager", { caseManagerId })} className="w-full btn-primary py-2 text-sm justify-center rounded-lg font-medium">
                      Assign Case Manager
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--bnr-text-secondary)]">Awaiting Compliance Officer to complete checks and assign case manager.</p>
              )
            ) : /* CASE_ASSIGNED: F&P Officer Only */
            appData.status === "CASE_ASSIGNED" ? (
              (userRole === "FIT_AND_PROPER_OFFICER" || userRole === "ADMIN") ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--bnr-text-secondary)] mb-2">Ready to start Fit and Proper Assessment.</p>
                  <button onClick={() => handleAction("start-fit-and-proper")} className="w-full btn-primary py-2 text-sm justify-center rounded-lg font-medium">
                    Start Fit and Proper Assessment
                  </button>
                  <button onClick={() => setShowFinalRejectModal(true)} className="w-full btn-secondary py-2 text-sm justify-center rounded-lg font-medium !text-red-600 !border-red-200 hover:!bg-red-50">
                    Reject Application
                  </button>
                </div>
              ) : (
                <p className="text-sm text-[var(--bnr-text-secondary)]">Awaiting F&P Officer to start assessments.</p>
              )
            ) : /* FIT_AND_PROPER_ASSESSMENT: F&P Officer Only */
            appData.status === "FIT_AND_PROPER_ASSESSMENT" ? (
              (userRole === "FIT_AND_PROPER_OFFICER" || userRole === "ADMIN") ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--bnr-text-secondary)] mb-1">
                    {assessments.length === 0 ? "Add individuals to begin assessments." : allFit ? "All individuals assessed as FIT." : "Complete all individual assessments."}
                  </p>
                  {allFit && (
                    <button onClick={() => handleAction("complete-fit-and-proper")} className="w-full btn-primary py-2 text-sm justify-center rounded-lg font-medium bg-green-600 hover:bg-green-700">
                      Conclude F&P &rarr; Technical Review
                    </button>
                  )}
                  {!allFit && assessments.length > 0 && (
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
                      All individuals must be assessed as FIT before concluding.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[var(--bnr-text-secondary)]">Fit and Proper Assessment is currently in progress by BNR staff.</p>
              )
            ) : /* TECHNICAL_REVIEW: Technical Reviewer Only */
            appData.status === "TECHNICAL_REVIEW" ? (
              (userRole === "TECHNICAL_REVIEWER" || userRole === "ADMIN") ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--bnr-text-secondary)] mb-2">Conduct technical review of the application.</p>
                  <button onClick={() => setShowRequestInfoModal(true)} className="w-full btn-secondary py-2 text-sm justify-center rounded-lg font-medium">
                    Request Additional Info
                  </button>
                  <button onClick={() => setShowFinalRejectModal(true)} className="w-full btn-secondary py-2 text-sm justify-center rounded-lg font-medium !text-red-600 !border-red-200 hover:!bg-red-50">
                    Reject Application
                  </button>
                </div>
              ) : (
                <p className="text-sm text-[var(--bnr-text-secondary)]">Application is under technical review.</p>
              )
            ) : /* LEGAL_REVIEW: Legal Officer Only */
            appData.status === "LEGAL_REVIEW" ? (
              (userRole === "LEGAL_OFFICER" || userRole === "ADMIN") ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--bnr-text-secondary)] mb-2">Conduct legal review of the application.</p>
                  <button onClick={() => setShowRequestInfoModal(true)} className="w-full btn-secondary py-2 text-sm justify-center rounded-lg font-medium">
                    Request Additional Info
                  </button>
                  <button onClick={() => setShowFinalRejectModal(true)} className="w-full btn-secondary py-2 text-sm justify-center rounded-lg font-medium !text-red-600 !border-red-200 hover:!bg-red-50">
                    Reject Application
                  </button>
                </div>
              ) : (
                <p className="text-sm text-[var(--bnr-text-secondary)]">Application is under legal review.</p>
              )
            ) : /* COMMITTEE_DELIBERATION: Committee Only */
            appData.status === "COMMITTEE_DELIBERATION" ? (
              (userRole === "LICENSING_COMMITTEE" || userRole === "ADMIN") ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--bnr-text-secondary)] mb-2">Review committee package and make decision.</p>
                  <button onClick={() => setShowDenyAipModal(true)} className="w-full btn-secondary py-2 text-sm justify-center rounded-lg font-medium !text-red-600 !border-red-200 hover:!bg-red-50">
                    Deny AIP
                  </button>
                  <button onClick={() => setShowGrantAipModal(true)} className="w-full btn-primary py-2 text-sm justify-center rounded-lg font-medium bg-green-600 hover:bg-green-700">
                    Grant AIP with Conditions
                  </button>
                </div>
              ) : (
                <p className="text-sm text-[var(--bnr-text-secondary)]">Awaiting Licensing Committee deliberation.</p>
              )
            ) : /* ORGANIZATION_PERIOD: Inspection Officer Only (to schedule) */
            appData.status === "ORGANIZATION_PERIOD" ? (
              (userRole === "INSPECTION_OFFICER" || userRole === "ADMIN") ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--bnr-text-secondary)] mb-2">Request the pre-license inspection once organization is complete.</p>
                  <div>
                    <label className="block text-sm font-medium text-[var(--bnr-text-secondary)] mb-1">Scheduled Inspection Date</label>
                    <input
                      type="date"
                      value={inspectionScheduledDate}
                      onChange={e => setInspectionScheduledDate(e.target.value)}
                      className="input-field w-full text-sm mb-2"
                      min={new Date().toISOString().split("T")[0]}
                    />
                    <button onClick={handleRequestInspection} className="w-full btn-primary py-2 text-sm justify-center rounded-lg font-medium bg-blue-600 hover:bg-blue-700">
                      Request Inspection
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--bnr-text-secondary)]">Applicant is in organization period. Awaiting inspection scheduling.</p>
              )
            ) : /* PRE_LICENSE_INSPECTION: Inspection Officer Only */
            appData.status === "PRE_LICENSE_INSPECTION" ? (
              (userRole === "INSPECTION_OFFICER" || userRole === "ADMIN") ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--bnr-text-secondary)] mb-2">Conduct the on-site inspection and submit the report.</p>
                  {!showInspectionReportForm ? (
                    <button onClick={() => setShowInspectionReportForm(true)} className="w-full btn-primary py-2 text-sm justify-center rounded-lg font-medium bg-blue-600 hover:bg-blue-700">
                      Submit Inspection Report
                    </button>
                  ) : (
                    <div className="space-y-2 border-t pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-[var(--bnr-text-secondary)] mb-1">Conducted Date</label>
                          <input type="date" value={inspectionConductedDate} onChange={e => setInspectionConductedDate(e.target.value)} className="input-field w-full text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--bnr-text-secondary)] mb-1">Outcome</label>
                          <select value={inspectionOutcome} onChange={e => setInspectionOutcome(e.target.value as "PASSED" | "FAILED")} className="input-field w-full text-sm bg-white">
                            <option value="PASSED">Passed</option>
                            <option value="FAILED">Failed</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={inspectionPremisesVerified} onChange={e => setInspectionPremisesVerified(e.target.checked)} /> Premises</label>
                        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={inspectionCapitalVerified} onChange={e => setInspectionCapitalVerified(e.target.checked)} /> Capital</label>
                        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={inspectionItSystemsVerified} onChange={e => setInspectionItSystemsVerified(e.target.checked)} /> IT Systems</label>
                        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={inspectionAmlFrameworkOk} onChange={e => setInspectionAmlFrameworkOk(e.target.checked)} /> AML Framework</label>
                        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={inspectionStaffingAdequate} onChange={e => setInspectionStaffingAdequate(e.target.checked)} /> Staffing</label>
                        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={inspectionPolicyManualsOk} onChange={e => setInspectionPolicyManualsOk(e.target.checked)} /> Policy Manuals</label>
                      </div>
                      {inspectionCapitalVerified && (
                        <div>
                          <label className="block text-xs text-[var(--bnr-text-secondary)] mb-1">Capital Amount (RWF)</label>
                          <input type="number" value={inspectionCapitalAmount} onChange={e => setInspectionCapitalAmount(e.target.value)} className="input-field w-full text-sm" placeholder="1000000000" />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-[var(--bnr-text-secondary)] mb-1">Findings</label>
                        <textarea value={inspectionFindings} onChange={e => setInspectionFindings(e.target.value)} className="input-field w-full text-sm" rows={2} placeholder="Inspection findings..." />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleSubmitInspectionReport} className="btn-primary text-sm py-1 px-3 rounded-lg">Submit Report</button>
                        <button onClick={() => setShowInspectionReportForm(false)} className="btn-secondary text-sm py-1 px-3 rounded-lg">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[var(--bnr-text-secondary)]">Inspection is currently in progress.</p>
              )
            ) : /* LICENSE_FEE_PENDING: Compliance for fee, Delegate for license */
            appData.status === "LICENSE_FEE_PENDING" ? (
              <div className="space-y-3">
                <p className="text-sm text-[var(--bnr-text-secondary)] mb-2">Confirm fee payment and issue the license.</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-[var(--bnr-text-secondary)] mb-1">Amount (RWF)</label>
                    <input type="number" value={feeAmount} onChange={e => setFeeAmount(e.target.value)} className="input-field w-full text-sm" placeholder="5000000" />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--bnr-text-secondary)] mb-1">Payment Ref</label>
                    <input type="text" value={feePaymentReference} onChange={e => setFeePaymentReference(e.target.value)} className="input-field w-full text-sm" placeholder="Receipt #" />
                  </div>
                </div>
                {(userRole === "COMPLIANCE_OFFICER" || userRole === "ADMIN") && !appData.licenseFeePaidAt && (
                   <button onClick={handleConfirmFeePayment} className="w-full btn-secondary py-2 text-sm justify-center rounded-lg font-medium">
                     Confirm Fee Payment
                   </button>
                )}
                {(userRole === "GOVERNOR_DELEGATE" || userRole === "ADMIN") && appData.licenseFeePaidAt && (
                   <button onClick={handleIssueLicense} className="w-full btn-primary py-2 text-sm justify-center rounded-lg font-medium bg-green-600 hover:bg-green-700">
                     Issue License
                   </button>
                )}
                {userRole !== "COMPLIANCE_OFFICER" && userRole !== "GOVERNOR_DELEGATE" && userRole !== "ADMIN" && (
                  <p className="text-sm text-[var(--bnr-text-secondary)] mt-4">
                    Awaiting Compliance Officer and Governor Delegate actions.
                  </p>
                )}
                {userRole === "COMPLIANCE_OFFICER" && appData.licenseFeePaidAt && (
                  <p className="text-sm text-[var(--bnr-text-secondary)] mt-4">
                    Fee confirmed. Awaiting Governor Delegate to issue license.
                  </p>
                )}
                {userRole === "GOVERNOR_DELEGATE" && !appData.licenseFeePaidAt && (
                  <p className="text-sm text-[var(--bnr-text-secondary)] mt-4">
                    Awaiting Compliance Officer to confirm fee payment.
                  </p>
                )}
              </div>
            ) : appData.status === "LICENSED" ? (
              <div className="space-y-3">
                <p className="text-sm text-emerald-600 font-medium">License has been issued!</p>
                <p className="text-xs text-[var(--bnr-text-secondary)]">License Number: {appData.licenseNumber}</p>
              </div>
            ) : appData.status === "INSPECTION_FAILED" ? (
              <div className="space-y-3">
                <p className="text-sm text-[var(--bnr-text-secondary)] mb-2">
                  Inspection failed. Applicant must address issues and request re-inspection.
                </p>
              </div>
            ) : appData.status === "AIP_EXPIRED" ? (
              <div className="space-y-3">
                <p className="text-sm text-[var(--bnr-text-secondary)] mb-2">
                  The AIP has expired. A new application would need to be submitted.
                </p>
              </div>
            ) : appData.status === "NAME_APPROVED" ? (
              <div className="space-y-3">
                <p className="text-sm text-[var(--bnr-text-secondary)]">
                  {userRole === "COMPLIANCE_OFFICER"
                    ? "Awaiting applicant action — the institution name has been approved. BNR is waiting for the applicant to submit their formal licensing application."
                    : userRole === "TECHNICAL_REVIEWER"
                    ? "This application has not yet reached the technical review stage. It is currently awaiting formal submission by the applicant."
                    : "The institution name has been approved. Awaiting formal submission by the applicant."}
                </p>
              </div>
            ) : (
              (() => {
                const waitingMessages: Record<string, string> = {
                  'COMPLIANCE_OFFICER:ADDITIONAL_INFO_REQUESTED': "BNR is awaiting the applicant's response. The SLA clock is paused until the applicant submits their response with the requested documents."
                };
                const messageKey = `${userRole}:${appData.status}`;
                return (
                  <p className="text-sm text-[var(--bnr-text-secondary)]">
                    {waitingMessages[messageKey] || `The current stage is ${appData.status.replace(/_/g, " ")}. No immediate action available.`}
                  </p>
                );
              })()
            )}
          </div>
        </div>
      </div>

      {/* Additional Info Request Modal */}
      {showAdditionalInfoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 space-y-4">
            <h3 className="text-lg font-bold text-[var(--bnr-text-primary)]">Request Additional Information</h3>
            <p className="text-sm text-[var(--bnr-text-secondary)]">
              Specify what additional information is required from the applicant. The SLA clock will be paused.
            </p>
            <div>
              <label className="block text-sm font-medium text-[var(--bnr-text-secondary)] mb-1">Information Requested (one per line)</label>
              <textarea
                value={additionalInfoList.join("\n")}
                onChange={e => setAdditionalInfoList(e.target.value.split("\n").filter(l => l.trim()))}
                className="input-field w-full text-sm"
                rows={5}
                placeholder={"Capital source documentation\nAML policy manual\nIT security certification"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--bnr-text-secondary)] mb-1">Reason / Context</label>
              <input type="text" value={additionalInfoReason} onChange={e => setAdditionalInfoReason(e.target.value)} className="input-field w-full text-sm" placeholder="Brief explanation..." />
            </div>
            <div className="flex gap-2">
              <button onClick={handleRequestAdditionalInfo} className="btn-primary text-sm py-2 px-4 rounded-lg">Send Request</button>
              <button onClick={() => setShowAdditionalInfoModal(false)} className="btn-secondary text-sm py-2 px-4 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {showDocumentsModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[var(--bnr-text-primary)]">Application Documents</h3>
              <button onClick={() => setShowDocumentsModal(false)} className="text-[var(--bnr-text-secondary)] hover:text-[var(--bnr-text-primary)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            {documents.length === 0 ? (
              <div className="py-8 text-center text-[var(--bnr-text-secondary)]">
                No documents have been uploaded for this application yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)] hover:bg-stone-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-stone-100 p-2 rounded-lg text-[var(--bnr-brown)]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[var(--bnr-text-primary)]">{doc.originalName}</p>
                        <p className="text-xs text-[var(--bnr-text-secondary)]">
                          {doc.documentType.replace(/_/g, " ")} &bull; {(doc.fileSizeBytes / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setPreviewDoc(doc)}
                        className="btn-secondary text-xs py-1.5 px-3 rounded"
                      >
                        View
                      </button>
                      <a 
                        href={`/api/applications/${id}/documents/${doc.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary text-xs py-1.5 px-3 rounded"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="pt-4 flex justify-end">
              <button onClick={() => setShowDocumentsModal(false)} className="btn-primary py-2 px-6 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] backdrop-blur-md">
          <div className="bg-white rounded-lg overflow-hidden w-full h-full max-w-5xl max-h-[90vh] mx-4 flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-stone-50">
              <div>
                <h3 className="text-lg font-bold text-[var(--bnr-text-primary)]">{previewDoc.originalName}</h3>
                <p className="text-xs text-[var(--bnr-text-secondary)]">{previewDoc.documentType.replace(/_/g, " ")}</p>
              </div>
              <div className="flex items-center gap-3">
                <a 
                  href={`/api/applications/${id}/documents/${previewDoc.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs py-2 px-4 rounded-lg"
                >
                  Download
                </a>
                <button onClick={() => setPreviewDoc(null)} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-stone-200">
              {previewDoc.mimeType.startsWith("image/") ? (
                <ImagePreview
                  src={`/api/applications/${id}/documents/${previewDoc.id}/view`}
                  alt={previewDoc.originalName}
                  applicationId={id}
                  document={previewDoc}
                />
              ) : previewDoc.mimeType === "application/pdf" ? (
                <PdfPreview 
                  src={`/api/applications/${id}/documents/${previewDoc.id}/view`}
                  title={previewDoc.originalName}
                />
              ) : (
                <div className="text-center p-12 bg-white rounded-lg shadow-xl max-w-md">
                  <div className="bg-stone-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--bnr-brown)]">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </div>
                  <h4 className="text-lg font-bold text-[var(--bnr-text-primary)] mb-2">Preview Not Available</h4>
                  <p className="text-sm text-[var(--bnr-text-secondary)] mb-6">
                    We can&apos;t display a preview for this file type ({previewDoc.mimeType}). Please download the file to view its content.
                  </p>
                  <a 
                    href={`/api/applications/${id}/documents/${previewDoc.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary py-2 px-8 rounded-lg"
                  >
                    Download Now
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Fulfill Condition Modal */}
      {showFulfillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-[var(--bnr-text-primary)]">Fulfill License Condition</h3>
            <p className="text-sm text-[var(--bnr-text-secondary)]">
              Mark this condition as fulfilled. You can optionally link a supporting document as proof.
            </p>
            <div>
              <label className="block text-sm font-medium text-[var(--bnr-text-secondary)] mb-1">Verification Note</label>
              <textarea
                value={fulfillmentNote}
                onChange={e => setFulfillmentNote(e.target.value)}
                className="input-field w-full text-sm"
                rows={3}
                placeholder="e.g., Verified on-site inspection of IT systems."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--bnr-text-secondary)] mb-1">Supporting Document (Proof)</label>
              <select
                value={fulfillmentDocumentId}
                onChange={e => setFulfillmentDocumentId(e.target.value)}
                className="input-field w-full text-sm bg-white"
              >
                <option value="">-- No document linked --</option>
                {documents.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.originalName} ({doc.documentType.replace(/_/g, " ")})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={async () => {
                  if (selectedConditionId) {
                    await handleFulfillCondition(selectedConditionId, fulfillmentNote, fulfillmentDocumentId || undefined);
                    setShowFulfillModal(false);
                  }
                }}
                className="btn-primary text-sm py-2 px-4 rounded-lg"
              >
                Confirm Fulfillment
              </button>
              <button onClick={() => setShowFulfillModal(false)} className="btn-secondary text-sm py-2 px-4 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modals */}
      <ReasonModal
        isOpen={showRejectNameModal}
        title="Reject Institution Name"
        actionLabel="Confirm Rejection"
        placeholder="Provide a reason for rejecting this proposed name..."
        onConfirm={async (reason) => {
          await handleAction("reject-name", { reason });
          setShowRejectNameModal(false);
        }}
        onCancel={() => setShowRejectNameModal(false)}
      />

      <ReasonModal
        isOpen={showMarkIncompleteModal}
        title="Mark Application Incomplete"
        actionLabel="Confirm Incomplete"
        placeholder="Specify what is missing or incorrect in the application..."
        onConfirm={async (reason) => {
          await handleAction("mark-incomplete", { reason });
          setShowMarkIncompleteModal(false);
        }}
        onCancel={() => setShowMarkIncompleteModal(false)}
      />

      <ReasonModal
        isOpen={showDenyAipModal}
        title="Deny Approval in Principle"
        actionLabel="Confirm Denial"
        placeholder="Provide a detailed reason for denying the application..."
        onConfirm={async (reason) => {
          await handleAction("deny-approval-in-principle", { reason });
          setShowDenyAipModal(false);
        }}
        onCancel={() => setShowDenyAipModal(false)}
      />

      <ReasonModal
        isOpen={showRequestInfoModal}
        title="Request Additional Information"
        actionLabel="Send Request"
        minLength={30}
        placeholder="Specify exactly what information or documents are required from the applicant..."
        onConfirm={async (reason) => {
          await requestAdditionalInfo(id, token, {
            infoRequested: [reason],
            reason: reason,
            returnToState: appData.status
          });
          setShowRequestInfoModal(false);
          await refreshData();
        }}
        onCancel={() => setShowRequestInfoModal(false)}
      />

      <ReasonModal
        isOpen={showFinalRejectModal}
        title="Reject Application"
        actionLabel="Confirm Rejection"
        placeholder="Provide the formal reason for the final rejection of this application..."
        onConfirm={async (reason) => {
          await handleAction("approval/reject", { reason });
          setShowFinalRejectModal(false);
        }}
        onCancel={() => setShowFinalRejectModal(false)}
      />
    </div>
  );
}