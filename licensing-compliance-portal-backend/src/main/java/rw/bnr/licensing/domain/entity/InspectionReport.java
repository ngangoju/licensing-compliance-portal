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
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "inspection_reports")
public class InspectionReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inspection_officer_id", nullable = false)
    private User inspectionOfficer;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "conducted_date")
    private LocalDate conductedDate;

    @Column(name = "premises_verified")
    private Boolean premisesVerified;

    @Column(name = "capital_verified")
    private Boolean capitalVerified;

    @Column(name = "capital_amount_rwf")
    private Long capitalAmountRwf;

    @Column(name = "it_systems_verified")
    private Boolean itSystemsVerified;

    @Column(name = "aml_framework_ok")
    private Boolean amlFrameworkOk;

    @Column(name = "staffing_adequate")
    private Boolean staffingAdequate;

    @Column(name = "policy_manuals_ok")
    private Boolean policyManualsOk;

    @Column(name = "overall_outcome")
    private String overallOutcome;

    @Column(name = "findings")
    private String findings;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public InspectionReport() {
    }

    public UUID getId() { return id; }
    public Application getApplication() { return application; }
    public void setApplication(Application application) { this.application = application; }
    public User getInspectionOfficer() { return inspectionOfficer; }
    public void setInspectionOfficer(User inspectionOfficer) { this.inspectionOfficer = inspectionOfficer; }
    public LocalDate getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }
    public LocalDate getConductedDate() { return conductedDate; }
    public void setConductedDate(LocalDate conductedDate) { this.conductedDate = conductedDate; }
    public Boolean getPremisesVerified() { return premisesVerified; }
    public void setPremisesVerified(Boolean premisesVerified) { this.premisesVerified = premisesVerified; }
    public Boolean getCapitalVerified() { return capitalVerified; }
    public void setCapitalVerified(Boolean capitalVerified) { this.capitalVerified = capitalVerified; }
    public Long getCapitalAmountRwf() { return capitalAmountRwf; }
    public void setCapitalAmountRwf(Long capitalAmountRwf) { this.capitalAmountRwf = capitalAmountRwf; }
    public Boolean getItSystemsVerified() { return itSystemsVerified; }
    public void setItSystemsVerified(Boolean itSystemsVerified) { this.itSystemsVerified = itSystemsVerified; }
    public Boolean getAmlFrameworkOk() { return amlFrameworkOk; }
    public void setAmlFrameworkOk(Boolean amlFrameworkOk) { this.amlFrameworkOk = amlFrameworkOk; }
    public Boolean getStaffingAdequate() { return staffingAdequate; }
    public void setStaffingAdequate(Boolean staffingAdequate) { this.staffingAdequate = staffingAdequate; }
    public Boolean getPolicyManualsOk() { return policyManualsOk; }
    public void setPolicyManualsOk(Boolean policyManualsOk) { this.policyManualsOk = policyManualsOk; }
    public String getOverallOutcome() { return overallOutcome; }
    public void setOverallOutcome(String overallOutcome) { this.overallOutcome = overallOutcome; }
    public String getFindings() { return findings; }
    public void setFindings(String findings) { this.findings = findings; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
