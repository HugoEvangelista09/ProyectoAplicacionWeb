package com.asociacion.repository;

import com.asociacion.model.Puesto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PuestoRepository extends JpaRepository<Puesto, Long> {
    List<Puesto> findBySocioId(Long socioId);
    List<Puesto> findBySocioIsNull();
    boolean existsByNumero(String numero);
    long countByCategoria(Integer categoria);

    @Query("SELECT p FROM Puesto p LEFT JOIN p.socio s WHERE " +
           "p.numero                    LIKE CONCAT('%',:term,'%') OR " +
           "LOWER(p.descripcion)        LIKE LOWER(CONCAT('%',:term,'%')) OR " +
           "LOWER(s.nombre)             LIKE LOWER(CONCAT('%',:term,'%')) OR " +
           "LOWER(s.apellido)           LIKE LOWER(CONCAT('%',:term,'%'))")
    List<Puesto> buscar(@Param("term") String term);
}
