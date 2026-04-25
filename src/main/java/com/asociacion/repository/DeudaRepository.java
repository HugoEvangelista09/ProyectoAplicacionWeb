package com.asociacion.repository;

import com.asociacion.model.Deuda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DeudaRepository extends JpaRepository<Deuda, Long> {
    List<Deuda> findBySocioId(Long socioId);
    List<Deuda> findBySocioIdAndEstado(Long socioId, Deuda.EstadoDeuda estado);

    // Para reporte de deudas por socio
    @Query("SELECT d FROM Deuda d WHERE d.estado != 'PAGADA' ORDER BY d.socio.apellido, d.fecha")
    List<Deuda> findAllDeudsPendientes();

    // Para reporte de caja diario
    @Query("SELECT d FROM Deuda d JOIN d.items i WHERE i.estado = 'PAGADO' AND CAST(d.fecha AS date) = :fecha")
    List<Deuda> findDeudasConPagoEnFecha(@Param("fecha") LocalDate fecha);
}
