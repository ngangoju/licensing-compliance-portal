package rw.bnr.licensing.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import rw.bnr.licensing.domain.entity.User;
import rw.bnr.licensing.config.CustomUserDetailsService;
import rw.bnr.licensing.domain.repository.UserRepository;
import rw.bnr.licensing.dto.auth.AuthResponse;
import rw.bnr.licensing.dto.auth.LoginRequest;
import rw.bnr.licensing.security.PortalUserPrincipal;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;

    public AuthService(
            UserRepository userRepository,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            CustomUserDetailsService userDetailsService
    ) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email().trim().toLowerCase(),
                        request.password()
                )
        );

        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow();

        PortalUserPrincipal principal = userDetailsService.loadPrincipalByEmail(user.getEmail());
        return buildAuthResponse(principal);
    }

    public AuthResponse refreshToken(String refreshToken) {
        String userEmail = jwtService.extractUsername(refreshToken);
        if (userEmail == null) {
            throw new BadCredentialsException("Invalid refresh token");
        }

        PortalUserPrincipal principal = userDetailsService.loadPrincipalByEmail(userEmail);
        if (!jwtService.isTokenValid(refreshToken, principal)) {
            throw new BadCredentialsException("Invalid refresh token");
        }

        return new AuthResponse(
                jwtService.generateToken(principal),
                refreshToken,
                principal.getUsername(),
                principal.getRole(),
                principal.getFullName(),
                principal.getOrganisation()
        );
    }

    private AuthResponse buildAuthResponse(PortalUserPrincipal principal) {
        return new AuthResponse(
                jwtService.generateToken(principal),
                jwtService.generateRefreshToken(principal),
                principal.getUsername(),
                principal.getRole(),
                principal.getFullName(),
                principal.getOrganisation()
        );
    }
}
