package com.asociacion.repository;

import com.asociacion.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUsername(String username);
    List<Usuario> findByActivoTrue();
    boolean existsByUsername(String username);
    boolean existsByDni(String dni);
    boolean existsByRuc(String ruc);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM Usuario u WHERE u.username = :username AND u.password = :password")
    Optional<Usuario> findByUsernameAndPassword(String username, String password);

    @Query("SELECT u FROM Usuario u WHERE " +
           "LOWER(u.username)       LIKE LOWER(CONCAT('%',:term,'%')) OR " +
           "LOWER(u.nombreCompleto) LIKE LOWER(CONCAT('%',:term,'%')) OR " +
           "u.dni                   LIKE CONCAT('%',:term,'%') OR " +
           "u.ruc                   LIKE CONCAT('%',:term,'%') OR " +
           "LOWER(u.email)          LIKE LOWER(CONCAT('%',:term,'%'))")
    List<Usuario> buscar(@Param("term") String term);
}
