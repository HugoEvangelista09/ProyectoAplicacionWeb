package com.asociacion.repository;

import com.asociacion.model.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {
    List<Pago> findBySocioId(Long socioId);
    List<Pago> findByFecha(LocalDate fecha);
    List<Pago> findByFechaBetween(LocalDate desde, LocalDate hasta);

    @Query("SELECT p FROM Pago p WHERE " +
           "LOWER(p.socio.nombre)   LIKE LOWER(CONCAT('%',:term,'%')) OR " +
           "LOWER(p.socio.apellido) LIKE LOWER(CONCAT('%',:term,'%')) OR " +
           "LOWER(p.observacion)    LIKE LOWER(CONCAT('%',:term,'%'))")
    List<Pago> buscar(@Param("term") String term);

    @Query("SELECT p FROM Pago p WHERE p.socio.id = :socioId AND (" +
           "LOWER(p.socio.nombre)   LIKE LOWER(CONCAT('%',:term,'%')) OR " +
           "LOWER(p.socio.apellido) LIKE LOWER(CONCAT('%',:term,'%')) OR " +
           "LOWER(p.observacion)    LIKE LOWER(CONCAT('%',:term,'%')))")
    List<Pago> buscarPorSocio(@Param("socioId") Long socioId, @Param("term") String term);
}
