package com.asociacion.repository;

import com.asociacion.model.MotivoCobro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MotivoCobroRepository extends JpaRepository<MotivoCobro, Long> {
    List<MotivoCobro> findByActivoTrue();
    boolean existsByNombre(String nombre);
}
