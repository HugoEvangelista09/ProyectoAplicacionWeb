package com.asociacion.repository;

import com.asociacion.model.MotivoCobro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MotivoCobroRepository extends JpaRepository<MotivoCobro, Long> {
    List<MotivoCobro> findByActivoTrue();
    boolean existsByNombre(String nombre);

    @Query("SELECT m FROM MotivoCobro m WHERE " +
           "LOWER(m.nombre)       LIKE LOWER(CONCAT('%',:term,'%')) OR " +
           "LOWER(m.descripcion)  LIKE LOWER(CONCAT('%',:term,'%'))")
    List<MotivoCobro> buscar(@Param("term") String term);
}
