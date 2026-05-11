package rw.bnr.licensing.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class SeparationOfDutiesException extends RuntimeException {
    public SeparationOfDutiesException(String message) {
        super(message);
    }
}