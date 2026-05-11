package rw.bnr.licensing.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import rw.bnr.licensing.dto.ErrorResponse;
import rw.bnr.licensing.exception.StorageException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
        return buildErrorResponse(
                "INVALID_CREDENTIALS",
                "Invalid email or password",
                HttpStatus.UNAUTHORIZED,
                null
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, Object> details = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                details.put(error.getField(), error.getDefaultMessage())
        );

        return buildErrorResponse(
                "VALIDATION_ERROR",
                "The request payload is invalid.",
                HttpStatus.UNPROCESSABLE_ENTITY,
                details
        );
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex) {
        return buildErrorResponse(
                "NOT_FOUND",
                ex.getMessage(),
                HttpStatus.NOT_FOUND,
                null
        );
    }

    @ExceptionHandler(FileValidationException.class)
    public ResponseEntity<ErrorResponse> handleFileValidation(FileValidationException ex) {
        return buildErrorResponse(
                "INVALID_FILE_UPLOAD",
                ex.getMessage(),
                HttpStatus.BAD_REQUEST,
                null
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return buildErrorResponse(
                "FORBIDDEN",
                ex.getMessage(),
                HttpStatus.FORBIDDEN,
                null
        );
    }

    @ExceptionHandler(SeparationOfDutiesException.class)
    public ResponseEntity<ErrorResponse> handleSeparationOfDuties(SeparationOfDutiesException ex) {
        return buildErrorResponse(
                "SEPARATION_OF_DUTIES",
                ex.getMessage(),
                HttpStatus.FORBIDDEN,
                null
        );
    }

    @ExceptionHandler(InvalidStateTransitionException.class)
    public ResponseEntity<ErrorResponse> handleInvalidStateTransition(InvalidStateTransitionException ex) {
        return buildErrorResponse(
                "INVALID_STATE_TRANSITION",
                ex.getMessage(),
                HttpStatus.CONFLICT,
                null
        );
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException ex) {
        return buildErrorResponse(
                "ILLEGAL_STATE",
                ex.getMessage(),
                HttpStatus.CONFLICT,
                null
        );
    }

    @ExceptionHandler(StorageException.class)
    public ResponseEntity<ErrorResponse> handleStorageException(StorageException ex) {
        return buildErrorResponse(
                "FILE_NOT_FOUND",
                ex.getMessage(),
                HttpStatus.NOT_FOUND,
                null
        );
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLock(ObjectOptimisticLockingFailureException ex) {
        return buildErrorResponse(
                "CONCURRENT_MODIFICATION",
                "This application was modified by another user. Please reload and try again.",
                HttpStatus.CONFLICT,
                null
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        return buildErrorResponse(
                "BAD_REQUEST",
                ex.getMessage(),
                HttpStatus.BAD_REQUEST,
                null
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        return buildErrorResponse(
                "INTERNAL_SERVER_ERROR",
                ex.getMessage(),
                HttpStatus.INTERNAL_SERVER_ERROR,
                null
        );
    }

    private ResponseEntity<ErrorResponse> buildErrorResponse(
            String code,
            String message,
            HttpStatus status,
            Map<String, Object> details
    ) {
        return new ResponseEntity<>(ErrorResponse.of(code, message, details), status);
    }
}
