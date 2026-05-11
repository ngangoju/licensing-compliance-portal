package rw.bnr.licensing.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import rw.bnr.licensing.domain.enums.UserRole;

import java.util.Collection;
import java.util.UUID;

public class PortalUserPrincipal implements UserDetails {

    private final UUID id;
    private final String email;
    private final String passwordHash;
    private final UserRole role;
    private final String fullName;
    private final String organisation;
    private final Collection<? extends GrantedAuthority> authorities;

    public PortalUserPrincipal(
            UUID id,
            String email,
            String passwordHash,
            UserRole role,
            String fullName,
            String organisation,
            Collection<? extends GrantedAuthority> authorities
    ) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.fullName = fullName;
        this.organisation = organisation;
        this.authorities = authorities;
    }

    public UUID getId() {
        return id;
    }

    public UserRole getRole() {
        return role;
    }

    public String getFullName() {
        return fullName;
    }

    public String getOrganisation() {
        return organisation;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }
}
