package rw.bnr.licensing.domain.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import rw.bnr.licensing.domain.enums.ApplicationStatus;
import rw.bnr.licensing.domain.enums.LicenseType;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "applications")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "reference_number", nullable = false, unique = true)
    private String referenceNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "applicant_id", nullable = false)
    private User applicant;

    @Enumerated(EnumType.STRING)
    @Column(name = "license_type", nullable = false)
    private LicenseType licenseType;

    @Column(name = "institution_name", nullable = false)
    private String institutionName;

    @Column(name = "proposed_name")
    private String proposedName;

    @Column(name = "proposed_capital_rwf", nullable = false)
    private Long proposedCapitalRwf;

    @Column(name = "registered_country", nullable = false)
    private String registeredCountry = "Rwanda";

    @Column(name = "head_office_address")
    private String headOfficeAddress;

    @Column(name = "is_foreign_institution", nullable = false)
    private boolean foreignInstitution;

    @Column(name = "home_supervisor_name")
    private String homeSupervisorName;

    @Column(name = "home_supervisor_email")
    private String homeSupervisorEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status = ApplicationStatus.DRAFT;

    @Version
    @Column(nullable = false)
    private Integer version;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_manager_id")
    private User caseManager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compliance_officer_id")
    private User complianceOfficer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technical_reviewer_id")
    private User technicalReviewer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "legal_officer_id")
    private User legalOfficer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_officer_id")
    private User inspectionOfficer;

    @Column(name = "sla_working_days_target", nullable = false)
    private Integer slaWorkingDaysTarget = 90;

    @Column(name = "sla_clock_started_at")
    private Instant slaClockStartedAt;

    @Column(name = "sla_clock_paused_at")
    private Instant slaClockPausedAt;

    @Column(name = "sla_working_days_used", nullable = false)
    private Integer slaWorkingDaysUsed = 0;

    @Column(name = "sla_paused_reason")
    private String slaPausedReason;

    @Column(name = "aip_granted_at")
    private Instant aipGrantedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aip_granted_by")
    private User aipGrantedBy;

    @Column(name = "aip_expires_at")
    private Instant aipExpiresAt;

    @Column(name = "organization_deadline")
    private Instant organizationDeadline;

    @Column(name = "license_fee_paid_at")
    private Instant licenseFeePaidAt;

    @Column(name = "license_issued_at")
    private Instant licenseIssuedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "license_issued_by")
    private User licenseIssuedBy;

    @Column(name = "license_number")
    private String licenseNumber;

    @Column(name = "completeness_notes")
    private String completenessNotes;

    @Column(name = "technical_review_notes")
    private String technicalReviewNotes;

    @Column(name = "legal_review_notes")
    private String legalReviewNotes;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "info_requested_reason")
    private String infoRequestedReason;

    @jakarta.persistence.ElementCollection(fetch = FetchType.EAGER)
    @jakarta.persistence.CollectionTable(name = "application_info_requested_items", joinColumns = @JoinColumn(name = "application_id"))
    @Column(name = "item")
    private List<String> infoRequestedItems = new ArrayList<>();

    @Column(name = "final_status_at")
    private Instant finalStatusAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LicenseCondition> conditions = new ArrayList<>();

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FitAndProperAssessment> fitAndProperAssessments = new ArrayList<>();

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ApplicationDocument> documents = new ArrayList<>();

    public Application() {
    }

    public UUID getId() {
        return id;
    }

    public String getReferenceNumber() {
        return referenceNumber;
    }

    public void setReferenceNumber(String referenceNumber) {
        this.referenceNumber = referenceNumber;
    }

    public User getApplicant() {
        return applicant;
    }

    public void setApplicant(User applicant) {
        this.applicant = applicant;
    }

    public LicenseType getLicenseType() {
        return licenseType;
    }

    public void setLicenseType(LicenseType licenseType) {
        this.licenseType = licenseType;
    }

    public String getInstitutionName() {
        return institutionName;
    }

    public void setInstitutionName(String institutionName) {
        this.institutionName = institutionName;
    }

    public String getProposedName() {
        return proposedName;
    }

    public void setProposedName(String proposedName) {
        this.proposedName = proposedName;
    }

    public Long getProposedCapitalRwf() {
        return proposedCapitalRwf;
    }

    public void setProposedCapitalRwf(Long proposedCapitalRwf) {
        this.proposedCapitalRwf = proposedCapitalRwf;
    }

    public String getRegisteredCountry() {
        return registeredCountry;
    }

    public void setRegisteredCountry(String registeredCountry) {
        this.registeredCountry = registeredCountry;
    }

    public String getHeadOfficeAddress() {
        return headOfficeAddress;
    }

    public void setHeadOfficeAddress(String headOfficeAddress) {
        this.headOfficeAddress = headOfficeAddress;
    }

    public boolean isForeignInstitution() {
        return foreignInstitution;
    }

    public void setForeignInstitution(boolean foreignInstitution) {
        this.foreignInstitution = foreignInstitution;
    }

    public String getHomeSupervisorName() {
        return homeSupervisorName;
    }

    public void setHomeSupervisorName(String homeSupervisorName) {
        this.homeSupervisorName = homeSupervisorName;
    }

    public String getHomeSupervisorEmail() {
        return homeSupervisorEmail;
    }

    public void setHomeSupervisorEmail(String homeSupervisorEmail) {
        this.homeSupervisorEmail = homeSupervisorEmail;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(ApplicationStatus status) {
        this.status = status;
    }

    public Integer getVersion() {
        return version;
    }

    public User getCaseManager() {
        return caseManager;
    }

    public void setCaseManager(User caseManager) {
        this.caseManager = caseManager;
    }

    public User getComplianceOfficer() {
        return complianceOfficer;
    }

    public void setComplianceOfficer(User complianceOfficer) {
        this.complianceOfficer = complianceOfficer;
    }

    public User getTechnicalReviewer() {
        return technicalReviewer;
    }

    public void setTechnicalReviewer(User technicalReviewer) {
        this.technicalReviewer = technicalReviewer;
    }

    public User getLegalOfficer() {
        return legalOfficer;
    }

    public void setLegalOfficer(User legalOfficer) {
        this.legalOfficer = legalOfficer;
    }

    public User getInspectionOfficer() {
        return inspectionOfficer;
    }

    public void setInspectionOfficer(User inspectionOfficer) {
        this.inspectionOfficer = inspectionOfficer;
    }

    public Integer getSlaWorkingDaysTarget() {
        return slaWorkingDaysTarget;
    }

    public void setSlaWorkingDaysTarget(Integer slaWorkingDaysTarget) {
        this.slaWorkingDaysTarget = slaWorkingDaysTarget;
    }

    public Instant getSlaClockStartedAt() {
        return slaClockStartedAt;
    }

    public void setSlaClockStartedAt(Instant slaClockStartedAt) {
        this.slaClockStartedAt = slaClockStartedAt;
    }

    public Instant getSlaClockPausedAt() {
        return slaClockPausedAt;
    }

    public void setSlaClockPausedAt(Instant slaClockPausedAt) {
        this.slaClockPausedAt = slaClockPausedAt;
    }

    public Integer getSlaWorkingDaysUsed() {
        return slaWorkingDaysUsed;
    }

    public void setSlaWorkingDaysUsed(Integer slaWorkingDaysUsed) {
        this.slaWorkingDaysUsed = slaWorkingDaysUsed;
    }

    public String getSlaPausedReason() {
        return slaPausedReason;
    }

    public void setSlaPausedReason(String slaPausedReason) {
        this.slaPausedReason = slaPausedReason;
    }

    public Instant getAipGrantedAt() {
        return aipGrantedAt;
    }

    public void setAipGrantedAt(Instant aipGrantedAt) {
        this.aipGrantedAt = aipGrantedAt;
    }

    public User getAipGrantedBy() {
        return aipGrantedBy;
    }

    public void setAipGrantedBy(User aipGrantedBy) {
        this.aipGrantedBy = aipGrantedBy;
    }

    public Instant getAipExpiresAt() {
        return aipExpiresAt;
    }

    public void setAipExpiresAt(Instant aipExpiresAt) {
        this.aipExpiresAt = aipExpiresAt;
    }

    public Instant getOrganizationDeadline() {
        return organizationDeadline;
    }

    public void setOrganizationDeadline(Instant organizationDeadline) {
        this.organizationDeadline = organizationDeadline;
    }

    public Instant getLicenseFeePaidAt() {
        return licenseFeePaidAt;
    }

    public void setLicenseFeePaidAt(Instant licenseFeePaidAt) {
        this.licenseFeePaidAt = licenseFeePaidAt;
    }

    public Instant getLicenseIssuedAt() {
        return licenseIssuedAt;
    }

    public void setLicenseIssuedAt(Instant licenseIssuedAt) {
        this.licenseIssuedAt = licenseIssuedAt;
    }

    public User getLicenseIssuedBy() {
        return licenseIssuedBy;
    }

    public void setLicenseIssuedBy(User licenseIssuedBy) {
        this.licenseIssuedBy = licenseIssuedBy;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }

    public String getCompletenessNotes() {
        return completenessNotes;
    }

    public void setCompletenessNotes(String completenessNotes) {
        this.completenessNotes = completenessNotes;
    }

    public String getTechnicalReviewNotes() {
        return technicalReviewNotes;
    }

    public void setTechnicalReviewNotes(String technicalReviewNotes) {
        this.technicalReviewNotes = technicalReviewNotes;
    }

    public String getLegalReviewNotes() {
        return legalReviewNotes;
    }

    public void setLegalReviewNotes(String legalReviewNotes) {
        this.legalReviewNotes = legalReviewNotes;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getInfoRequestedReason() {
        return infoRequestedReason;
    }

    public void setInfoRequestedReason(String infoRequestedReason) {
        this.infoRequestedReason = infoRequestedReason;
    }

    public List<String> getInfoRequestedItems() {
        return infoRequestedItems;
    }

    public void setInfoRequestedItems(List<String> infoRequestedItems) {
        this.infoRequestedItems = infoRequestedItems;
    }

    public Instant getFinalStatusAt() {
        return finalStatusAt;
    }

    public void setFinalStatusAt(Instant finalStatusAt) {
        this.finalStatusAt = finalStatusAt;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public List<LicenseCondition> getConditions() {
        return conditions;
    }

    public List<FitAndProperAssessment> getFitAndProperAssessments() {
        return fitAndProperAssessments;
    }

    public List<ApplicationDocument> getDocuments() {
        return documents;
    }
}
