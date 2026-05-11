package rw.bnr.licensing.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
import rw.bnr.licensing.domain.enums.ApplicationStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class InvalidStateTransitionException extends RuntimeException {
    public InvalidStateTransitionException(ApplicationStatus from, ApplicationStatus to) {
        super(String.format("Invalid state transition from %s to %s", from, to));
    }
}
