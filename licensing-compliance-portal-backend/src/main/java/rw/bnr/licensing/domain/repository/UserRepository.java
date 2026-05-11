package rw.bnr.licensing.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.bnr.licensing.domain.entity.User;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmail(String email);
}
