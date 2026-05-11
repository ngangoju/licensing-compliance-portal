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
import java.util.UUID;

@Entity
@Table(name = "license_conditions")
public class LicenseCondition {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(name = "condition_text", nullable = false)
    private String conditionText;

    @Column(nullable = false)
    private String category;

    @Column(name = "is_fulfilled", nullable = false)
    private boolean fulfilled;

    @Column(name = "fulfilled_at")
    private Instant fulfilledAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fulfilled_by")
    private User fulfilledBy;

    @Column(name = "fulfillment_note")
    private String fulfillmentNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fulfillment_document_id")
    private ApplicationDocument fulfillmentDocument;

    @Column(name = "due_date")
    private Instant dueDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public LicenseCondition() {
    }

    public UUID getId() {
        return id;
    }

    public Application getApplication() {
        return application;
    }

    public void setApplication(Application application) {
        this.application = application;
    }

    public String getConditionText() {
        return conditionText;
    }

    public void setConditionText(String conditionText) {
        this.conditionText = conditionText;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public boolean isFulfilled() {
        return fulfilled;
    }

    public void setFulfilled(boolean fulfilled) {
        this.fulfilled = fulfilled;
    }

    public Instant getFulfilledAt() {
        return fulfilledAt;
    }

    public void setFulfilledAt(Instant fulfilledAt) {
        this.fulfilledAt = fulfilledAt;
    }

    public User getFulfilledBy() {
        return fulfilledBy;
    }

    public void setFulfilledBy(User fulfilledBy) {
        this.fulfilledBy = fulfilledBy;
    }

    public String getFulfillmentNote() {
        return fulfillmentNote;
    }

    public void setFulfillmentNote(String fulfillmentNote) {
        this.fulfillmentNote = fulfillmentNote;
    }

    public ApplicationDocument getFulfillmentDocument() {
        return fulfillmentDocument;
    }

    public void setFulfillmentDocument(ApplicationDocument fulfillmentDocument) {
        this.fulfillmentDocument = fulfillmentDocument;
    }

    public Instant getDueDate() {
        return dueDate;
    }

    public void setDueDate(Instant dueDate) {
        this.dueDate = dueDate;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
