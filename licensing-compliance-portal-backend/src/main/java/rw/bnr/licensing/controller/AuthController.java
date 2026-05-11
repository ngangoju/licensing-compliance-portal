package rw.bnr.licensing.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import rw.bnr.licensing.dto.auth.AuthResponse;
import rw.bnr.licensing.dto.auth.LoginRequest;
import rw.bnr.licensing.dto.auth.RefreshTokenRequest;
import rw.bnr.licensing.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication and token management endpoints")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token using a refresh token")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request.refreshToken()));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Stateless logout endpoint for client cleanup")
    public void logout() {
    }
}
