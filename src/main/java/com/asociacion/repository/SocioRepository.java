package com.asociacion.repository;

import com.asociacion.model.Socio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SocioRepository extends JpaRepository<Socio, Long> {
    Optional<Socio> findByDni(String dni);
    List<Socio> findByActivoTrue();
    boolean existsByDni(String dni);
    boolean existsByUsername(String username);

    @Query("SELECT s FROM Socio s WHERE s.username = :username AND s.password = :password")
    Optional<Socio> findByUsernameAndPassword(String username, String password);
}
