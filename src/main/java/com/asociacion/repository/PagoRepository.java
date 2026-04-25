package com.asociacion.repository;

import com.asociacion.model.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {
    List<Pago> findBySocioId(Long socioId);
    List<Pago> findByFecha(LocalDate fecha);
    List<Pago> findByFechaBetween(LocalDate desde, LocalDate hasta);
}
