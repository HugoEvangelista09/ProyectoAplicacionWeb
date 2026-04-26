package com.asociacion.repository;

import com.asociacion.model.Socio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query("SELECT s FROM Socio s WHERE " +
           "LOWER(s.nombre)   LIKE LOWER(CONCAT('%',:term,'%')) OR " +
           "LOWER(s.apellido) LIKE LOWER(CONCAT('%',:term,'%')) OR " +
           "s.dni             LIKE CONCAT('%',:term,'%')")
    List<Socio> buscar(@Param("term") String term);
}
