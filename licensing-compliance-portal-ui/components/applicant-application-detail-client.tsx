"use client";

import { useEffect, useState } from "react";
import { ApplicationStatus } from "@/types";
import { getApplicationDetail, ApplicationDetailResponse, transitionApplication, getFitAndProperAssessments, FitAndProperAssessmentResponse, getDocuments, ApplicationDocumentResponse, getLicenseConditions, LicenseConditionResponse } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SlaWidget } from "@/components/ui/SlaWidget";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { DocumentUploadZone } from "@/components/ui/DocumentUploadZone";
import { BackButton } from "@/components/ui/BackButton";
import { DOCUMENT_TYPE_LABELS, REQUIRED_DOCUMENTS } from "@/lib/document-constants";

export function ApplicantApplicationDetailClient({
  id,
  token,
  initialData,
}: {
  id: string;
  token: string;
  initialData: ApplicationDetailResponse;
}) {
  const [appData, setAppData] = useState<ApplicationDetailResponse>(initialData);
  const [assessments, setAssessments] = useState<FitAndProperAssessmentResponse[]>([]);
  const [documents, setDocuments] = useState<ApplicationDocumentResponse[]>([]);
  const [conditions, setConditions] = useState<LicenseConditionResponse[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitAction, setSubmitAction] = useState<string | null>(null);
  const [responseNotes, setResponseNotes] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const docs = await getDocuments(id, token);
        setDocuments(docs);
        
        if (appData.status === "FIT_AND_PROPER_ASSESSMENT") {
          const assessmentsData = await getFitAndProperAssessments(id, token);
          setAssessments(assessmentsData);
        }

        if (["APPROVAL_IN_PRINCIPLE", "ORGANIZATION_PERIOD", "PRE_LICENSE_INSPECTION", "LICENSED"].includes(appData.status)) {
          const conds = await getLicenseConditions(id, token);
          setConditions(conds);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchData();
  }, [appData.status, id, token]);



  const handleAction = async (action: string) => {
    try {
      const payload = action === "additional-info/respond" ? { responseNotes } : undefined;
      await transitionApplication(id, action, token, payload);
      const data = await getApplicationDetail(id, token);
      setAppData(data);
      setShowSubmitModal(false);
      setSubmitAction(null);
      setResponseNotes("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert("Error: " + err.message);
      } else {
        alert("An unknown error occurred");
      }
    }
  };

  const confirmAction = (action: string) => {
    setSubmitAction(action);
    setShowSubmitModal(true);
  };

  const fitCount = assessments.filter(a => a.outcome === "FIT").length;
  const pendingCount = assessments.filter(a => a.outcome === "PENDING").length;
  const notFitCount = assessments.filter(a => a.outcome === "NOT_FIT").length;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="pt-2">
        <BackButton label="Back to My Applications" href="/applicant/dashboard" />
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--bnr-text-primary)]">
            {appData.proposedName || appData.institutionName}
          </h1>
          <div className="mt-2 flex items-center gap-3 text-[var(--bnr-text-secondary)]">
            <span>{appData.referenceNumber}</span>
            <span>&bull;</span>
            <span>{appData.licenseType.replace(/_/g, " ")}</span>
            <span>&bull;</span>
            <StatusBadge status={appData.status} />
          </div>
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
            </div>
          </div>

          {/* Read-only F&P status shown during FIT_AND_PROPER_ASSESSMENT */}
          {appData.status === "FIT_AND_PROPER_ASSESSMENT" && (
            <div className="surface-panel rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[var(--bnr-text-primary)] mb-4">Fit & Proper Assessment</h2>
              <p className="text-sm text-[var(--bnr-text-secondary)] mb-4">
                BNR is reviewing each director, senior manager, and significant shareholder. This process is handled entirely by BNR staff.
              </p>
              {assessments.length === 0 ? (
                <p className="text-sm text-[var(--bnr-text-secondary)]">BNR will list the individuals to be assessed.</p>
              ) : (
                <div className="space-y-2">
                  {assessments.map(a => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-white p-3">
                      <div>
                        <p className="font-medium text-[var(--bnr-text-primary)]">{a.individualName}</p>
                        <p className="text-xs text-[var(--bnr-text-secondary)]">{a.individualRole}</p>
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
                        a.outcome === "FIT" ? "bg-emerald-100 text-emerald-700" :
                        a.outcome === "NOT_FIT" ? "bg-red-100 text-red-700" :
                        "bg-stone-100 text-stone-500"
                      }`}>
                        {a.outcome}
                      </span>
                    </div>
                  ))}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-emerald-50 p-2">
                      <p className="text-lg font-bold text-emerald-700">{fitCount}</p>
                      <p className="text-xs text-emerald-600">FIT</p>
                    </div>
                    <div className="rounded-lg bg-stone-50 p-2">
                      <p className="text-lg font-bold text-stone-600">{pendingCount}</p>
                      <p className="text-xs text-stone-500">Pending</p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-2">
                      <p className="text-lg font-bold text-red-700">{notFitCount}</p>
                      <p className="text-xs text-red-600">Not FIT</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* License Conditions */}
          {conditions.length > 0 && (
            <div className="surface-panel rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[var(--bnr-text-primary)] mb-4">License Conditions</h2>
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[var(--bnr-text-secondary)]">Fulfillment Progress</span>
                  <span className="font-semibold text-[var(--bnr-text-primary)]">
                    {Math.round((conditions.filter(c => c.fulfilled).length / conditions.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-2.5">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${(conditions.filter(c => c.fulfilled).length / conditions.length) * 100}%` }}
                  />
                </div>
              </div>
              <div className="space-y-3">
                {conditions.map((condition) => (
                  <div key={condition.id} className="p-4 rounded-lg border border-[var(--border)] bg-white">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-[var(--bnr-text-primary)]">{condition.conditionText}</p>
                        <p className="text-xs text-[var(--bnr-text-secondary)] mt-1 uppercase tracking-wider">
                          Category: {condition.category.replace(/_/g, " ")}
                        </p>
                        {condition.dueDate && (
                          <p className="text-xs text-amber-600 mt-1 font-medium">
                            Due by: {new Intl.DateTimeFormat('en-RW', { day:'2-digit', month:'short', year:'numeric' }).format(new Date(condition.dueDate))}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
                          condition.fulfilled ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {condition.fulfilled ? "Fulfilled" : "Pending"}
                        </span>
                      </div>
                    </div>
                    {condition.fulfilled && (
                      <div className="mt-3 p-2 rounded bg-emerald-50 border border-emerald-100 text-xs text-emerald-800">
                        <strong>Verified:</strong> {condition.fulfillmentNote || "Fulfilled as per requirement."}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-[var(--bnr-text-secondary)] italic">
                Note: Please ensure all supporting documents for these conditions are uploaded in the &quot;Required Documents&quot; section or provided during on-site inspection.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Phase 5: Additional Information Request Notice */}
          {appData.status === "ADDITIONAL_INFO_REQUESTED" && (
            <div className="surface-panel rounded-lg p-6 border-2 border-amber-400 bg-amber-50 shadow-sm">
              <h2 className="text-lg font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <svg className="h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                Action Required: Additional Information Requested
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-amber-200">
                  <p className="text-sm font-medium text-amber-900 mb-2">BNR requires the following items to proceed:</p>
                  <ul className="list-disc list-inside text-sm text-amber-800 space-y-1 ml-1">
                    {appData.infoRequestedItems?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                  {appData.infoRequestedReason && (
                    <div className="mt-4 pt-3 border-t border-amber-100">
                      <p className="text-xs text-amber-700 uppercase font-bold tracking-wider mb-1">BNR Feedback:</p>
                      <p className="text-sm text-amber-800 italic leading-relaxed">&quot;{appData.infoRequestedReason}&quot;</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">Your Clarification / Response</label>
                  <textarea
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    className="input-field w-full text-sm bg-white border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                    rows={4}
                    placeholder="Provide your clarification or response here..."
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleAction("additional-info/respond")}
                    disabled={!responseNotes.trim()}
                    className="btn-primary bg-amber-600 hover:bg-amber-700 border-none px-8 py-2.5 rounded-lg font-bold shadow-md disabled:opacity-50 transition-all"
                  >
                    Submit Response to BNR
                  </button>
                </div>
              </div>
            </div>
          )}

           <div className="surface-panel rounded-lg p-6">
             <h3 className="text-sm uppercase tracking-wider text-[var(--bnr-text-secondary)] font-semibold mb-3">Required Documents</h3>
             <div className="space-y-4">
               {(() => {
                 const requiredTypes = REQUIRED_DOCUMENTS[appData.licenseType] || [];
                 return requiredTypes.map(type => {
                   const doc = documents.find(d => d.documentType === type);
                   return (
                     <div key={type}>
                       <p className="text-[11px] uppercase tracking-widest font-mono text-[var(--bnr-text-muted)] mb-1">
                         {DOCUMENT_TYPE_LABELS[type] || type.replace(/_/g, " ")}
                       </p>
                       <span className="text-[11px] text-red-500 font-semibold">Required</span>
                       <DocumentUploadZone
                         documentType={type}
                         applicationId={id}
                         appStatus={appData.status as ApplicationStatus}
                         isUploaded={!!doc}
                         uploadedFilename={doc?.originalName}
                         uploadedDate={doc ? new Intl.DateTimeFormat('en-RW', { day:'2-digit', month:'short', year:'numeric' }).format(new Date(doc.createdAt)) : undefined}
                         onUploadSuccess={async () => {
                           const updatedDocs = await getDocuments(id, token);
                           setDocuments(updatedDocs);
                         }}
                       />
                     </div>
                   );
                 });
               })()}
               <div className="pt-4 border-t border-[var(--border)]">
                 <p className="text-xs font-semibold text-[var(--bnr-text-secondary)] mb-2 uppercase tracking-wider">Other Supporting Documents</p>
                 <div>
                   <p className="text-[11px] uppercase tracking-widest font-mono text-[var(--bnr-text-muted)] mb-1">
                     {DOCUMENT_TYPE_LABELS.SUPPORTING_DOC}
                   </p>
                   <span className="text-[11px] text-red-500 font-semibold">Required</span>
                   <DocumentUploadZone
                     documentType="SUPPORTING_DOC"
                     applicationId={id}
                     appStatus={appData.status as ApplicationStatus}
                     onUploadSuccess={async () => {
                       const updatedDocs = await getDocuments(id, token);
                       setDocuments(updatedDocs);
                     }}
                   />
                 </div>
               </div>
             </div>
           </div>

          {appData.status !== "DRAFT" && appData.status !== "NAME_APPROVAL_PENDING" && appData.status !== "NAME_APPROVED" && (
            <SlaWidget 
              targetDays={appData.slaWorkingDaysTarget} 
              usedDays={appData.slaWorkingDaysUsed} 
              isPaused={appData.status === "INCOMPLETE" || appData.status === "ADDITIONAL_INFO_REQUESTED"}
              pauseReason={appData.slaPausedReason}
            />
          )}

          <div className="surface-panel rounded-lg p-6">
            <h3 className="text-sm uppercase tracking-wider text-[var(--bnr-text-secondary)] font-semibold mb-3">Quick Actions</h3>
            {appData.status === "DRAFT" ? (
              <button onClick={() => confirmAction("submit-name-approval")} className="w-full btn-primary py-2 text-sm justify-center rounded-lg font-medium">
                Request Name Approval
              </button>
            ) : appData.status === "NAME_APPROVED" || appData.status === "INCOMPLETE" ? (
              <button onClick={() => confirmAction("submit")} className="w-full btn-primary py-2 text-sm justify-center rounded-lg font-medium">
                {appData.status === "INCOMPLETE" ? "Resubmit Application" : "Formal Submission"}
              </button>
            ) : appData.status === "NAME_APPROVAL_PENDING" ? (
              <p className="text-sm text-[var(--bnr-text-secondary)]">Awaiting name approval from BNR...</p>
            ) : appData.status === "FIT_AND_PROPER_ASSESSMENT" ? (
              <p className="text-sm text-[var(--bnr-text-secondary)]">BNR is conducting the fit and proper assessment. No action required from you.</p>
            ) : (
              <p className="text-sm text-[var(--bnr-text-secondary)]">No actions currently required.</p>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={() => submitAction && handleAction(submitAction)}
        title="Confirm Submission"
        body={
          <p>
            Are you sure you want to proceed with this submission? This action will forward your application to the BNR for review.
          </p>
        }
        confirmLabel="Submit Application"
        confirmPhrase={submitAction === "submit" ? "I CONFIRM" : undefined}
      />
    </div>
  );
}