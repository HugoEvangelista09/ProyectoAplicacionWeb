package com.asociacion.repository;

import com.asociacion.model.DeudaItem;
import com.asociacion.model.EstadoItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeudaItemRepository extends JpaRepository<DeudaItem, Long> {
    List<DeudaItem> findByDeudaId(Long deudaId);
    List<DeudaItem> findByDeudaIdAndEstado(Long deudaId, EstadoItem estado);
    List<DeudaItem> findByIdInAndEstado(List<Long> ids, EstadoItem estado);
}
