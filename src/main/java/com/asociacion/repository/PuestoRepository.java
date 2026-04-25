package com.asociacion.repository;

import com.asociacion.model.Puesto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PuestoRepository extends JpaRepository<Puesto, Long> {
    List<Puesto> findBySocioId(Long socioId);
    List<Puesto> findBySocioIsNull();
    boolean existsByNumero(String numero);
    long countByCategoria(Integer categoria);
}
