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
import rw.bnr.licensing.domain.enums.ApplicationStatus;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "application_documents")
public class ApplicationDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(name = "document_type", nullable = false)
    private String documentType;

    @Column(name = "original_name", nullable = false)
    private String originalName;

    @Column(name = "stored_path", nullable = false)
    private String storedPath;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    @Column(name = "file_size_bytes", nullable = false)
    private Integer fileSizeBytes;

    @Column(nullable = false)
    private Integer version;

    @Column(name = "is_current", nullable = false)
    private boolean current;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "upload_stage", nullable = false)
    private ApplicationStatus uploadStage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public ApplicationDocument() {
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

    public String getDocumentType() {
        return documentType;
    }

    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }

    public String getOriginalName() {
        return originalName;
    }

    public void setOriginalName(String originalName) {
        this.originalName = originalName;
    }

    public String getStoredPath() {
        return storedPath;
    }

    public void setStoredPath(String storedPath) {
        this.storedPath = storedPath;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public Integer getFileSizeBytes() {
        return fileSizeBytes;
    }

    public void setFileSizeBytes(Integer fileSizeBytes) {
        this.fileSizeBytes = fileSizeBytes;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public boolean isCurrent() {
        return current;
    }

    public void setCurrent(boolean current) {
        this.current = current;
    }

    public User getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(User uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public ApplicationStatus getUploadStage() {
        return uploadStage;
    }

    public void setUploadStage(ApplicationStatus uploadStage) {
        this.uploadStage = uploadStage;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
