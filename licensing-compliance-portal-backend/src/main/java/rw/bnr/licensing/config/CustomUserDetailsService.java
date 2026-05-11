package rw.bnr.licensing.config;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import rw.bnr.licensing.domain.entity.User;
import rw.bnr.licensing.domain.repository.UserRepository;
import rw.bnr.licensing.security.PortalUserPrincipal;

import java.util.List;
import java.util.UUID;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return buildPrincipal(
                userRepository.findByEmailIgnoreCase(username)
                        .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username))
        );
    }

    public PortalUserPrincipal loadPrincipalById(UUID userId) {
        return buildPrincipal(
                userRepository.findById(userId)
                        .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId))
        );
    }

    public PortalUserPrincipal loadPrincipalByEmail(String email) {
        return buildPrincipal(
                userRepository.findByEmailIgnoreCase(email)
                        .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email))
        );
    }

    private PortalUserPrincipal buildPrincipal(User user) {
        if (!user.isActive()) {
            throw new UsernameNotFoundException("User is inactive: " + user.getEmail());
        }

        return new PortalUserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getRole(),
                user.getFullName(),
                user.getOrganisation(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
}
