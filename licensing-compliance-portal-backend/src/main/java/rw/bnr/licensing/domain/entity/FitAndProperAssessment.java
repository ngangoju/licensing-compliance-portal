package rw.bnr.licensing.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "fit_and_proper_assessments")
public class FitAndProperAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assessed_by", nullable = false)
    private User assessedBy;

    @Column(name = "individual_name", nullable = false)
    private String individualName;

    @Column(name = "individual_role", nullable = false)
    private String individualRole;

    @Column(name = "shareholding_pct")
    private Double shareholdingPct;

    @Column(name = "national_id")
    private String nationalId;

    @Column(name = "nationality")
    private String nationality;

    @Column(name = "criminal_record_clear")
    private Boolean criminalRecordClear;

    @Column(name = "financial_history_clear")
    private Boolean financialHistoryClear;

    @Column(name = "qualifications_adequate")
    private Boolean qualificationsAdequate;

    @Column(name = "no_conflict_of_interest")
    private Boolean noConflictOfInterest;

    @Column(name = "interview_conducted", nullable = false)
    private boolean interviewConducted;

    @Column(name = "interview_date")
    private LocalDate interviewDate;

    @Column(name = "interview_notes")
    private String interviewNotes;

    @Column(name = "outcome")
    private String outcome;

    @Column(name = "outcome_notes")
    private String outcomeNotes;

    @Column(name = "assessed_at")
    private Instant assessedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public FitAndProperAssessment() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Application getApplication() {
        return application;
    }

    public void setApplication(Application application) {
        this.application = application;
    }

    public User getAssessedBy() {
        return assessedBy;
    }

    public void setAssessedBy(User assessedBy) {
        this.assessedBy = assessedBy;
    }

    public String getIndividualName() {
        return individualName;
    }

    public void setIndividualName(String individualName) {
        this.individualName = individualName;
    }

    public String getIndividualRole() {
        return individualRole;
    }

    public void setIndividualRole(String individualRole) {
        this.individualRole = individualRole;
    }

    public Double getShareholdingPct() {
        return shareholdingPct;
    }

    public void setShareholdingPct(Double shareholdingPct) {
        this.shareholdingPct = shareholdingPct;
    }

    public String getNationalId() {
        return nationalId;
    }

    public void setNationalId(String nationalId) {
        this.nationalId = nationalId;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }

    public Boolean getCriminalRecordClear() {
        return criminalRecordClear;
    }

    public void setCriminalRecordClear(Boolean criminalRecordClear) {
        this.criminalRecordClear = criminalRecordClear;
    }

    public Boolean getFinancialHistoryClear() {
        return financialHistoryClear;
    }

    public void setFinancialHistoryClear(Boolean financialHistoryClear) {
        this.financialHistoryClear = financialHistoryClear;
    }

    public Boolean getQualificationsAdequate() {
        return qualificationsAdequate;
    }

    public void setQualificationsAdequate(Boolean qualificationsAdequate) {
        this.qualificationsAdequate = qualificationsAdequate;
    }

    public Boolean getNoConflictOfInterest() {
        return noConflictOfInterest;
    }

    public void setNoConflictOfInterest(Boolean noConflictOfInterest) {
        this.noConflictOfInterest = noConflictOfInterest;
    }

    public boolean isInterviewConducted() {
        return interviewConducted;
    }

    public void setInterviewConducted(boolean interviewConducted) {
        this.interviewConducted = interviewConducted;
    }

    public LocalDate getInterviewDate() {
        return interviewDate;
    }

    public void setInterviewDate(LocalDate interviewDate) {
        this.interviewDate = interviewDate;
    }

    public String getInterviewNotes() {
        return interviewNotes;
    }

    public void setInterviewNotes(String interviewNotes) {
        this.interviewNotes = interviewNotes;
    }

    public String getOutcome() {
        return outcome;
    }

    public void setOutcome(String outcome) {
        this.outcome = outcome;
    }

    public String getOutcomeNotes() {
        return outcomeNotes;
    }

    public void setOutcomeNotes(String outcomeNotes) {
        this.outcomeNotes = outcomeNotes;
    }

    public Instant getAssessedAt() {
        return assessedAt;
    }

    public void setAssessedAt(Instant assessedAt) {
        this.assessedAt = assessedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
