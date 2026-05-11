package rw.bnr.licensing.service;

import org.springframework.stereotype.Service;
import rw.bnr.licensing.domain.enums.ApplicationStatus;
import rw.bnr.licensing.exception.InvalidStateTransitionException;

import java.util.Map;
import java.util.Set;

import static java.util.Map.entry;
import static rw.bnr.licensing.domain.enums.ApplicationStatus.*;

@Service
public class StateMachineService {

    private static final Map<ApplicationStatus, Set<ApplicationStatus>> TRANSITIONS = Map.ofEntries(
            entry(DRAFT,                     Set.of(NAME_APPROVAL_PENDING, WITHDRAWN)),
            entry(NAME_APPROVAL_PENDING,     Set.of(NAME_APPROVED, DRAFT)),
            entry(NAME_APPROVED,             Set.of(SUBMITTED)),
            entry(SUBMITTED,                 Set.of(COMPLETENESS_CHECK, WITHDRAWN)),
            entry(COMPLETENESS_CHECK,        Set.of(INCOMPLETE, CASE_ASSIGNED)),
            entry(INCOMPLETE,                Set.of(SUBMITTED)),
            entry(CASE_ASSIGNED,             Set.of(FIT_AND_PROPER_ASSESSMENT)),
            entry(FIT_AND_PROPER_ASSESSMENT, Set.of(ADDITIONAL_INFO_REQUESTED, TECHNICAL_REVIEW)),
            entry(ADDITIONAL_INFO_REQUESTED, Set.of(FIT_AND_PROPER_ASSESSMENT, TECHNICAL_REVIEW, LEGAL_REVIEW)),
            entry(TECHNICAL_REVIEW,          Set.of(ADDITIONAL_INFO_REQUESTED, LEGAL_REVIEW)),
            entry(LEGAL_REVIEW,              Set.of(ADDITIONAL_INFO_REQUESTED, COMMITTEE_DELIBERATION)),
            entry(COMMITTEE_DELIBERATION,    Set.of(APPROVAL_IN_PRINCIPLE, REJECTED)),
            entry(APPROVAL_IN_PRINCIPLE,     Set.of(ORGANIZATION_PERIOD)),
            entry(ORGANIZATION_PERIOD,       Set.of(PRE_LICENSE_INSPECTION, AIP_EXPIRED)),
            entry(PRE_LICENSE_INSPECTION,    Set.of(INSPECTION_FAILED, LICENSE_FEE_PENDING)),
            entry(INSPECTION_FAILED,         Set.of(ORGANIZATION_PERIOD)),
            entry(LICENSE_FEE_PENDING,       Set.of(LICENSED))
    );

    public void assertTransition(ApplicationStatus from, ApplicationStatus to) {
        if (!TRANSITIONS.getOrDefault(from, Set.of()).contains(to)) {
            throw new InvalidStateTransitionException(from, to);
        }
    }
}
