package com.asociacion.service;

import com.asociacion.dto.PagoRequestDTO;
import com.asociacion.dto.PagoResponseDTO;
import com.asociacion.mapper.PagoMapper;
import com.asociacion.model.*;
import com.asociacion.repository.DeudaItemRepository;
import com.asociacion.repository.PagoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PagoService {

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired
    private DeudaItemRepository deudaItemRepository;

    @Autowired
    private SocioService socioService;

    @Autowired
    private DeudaService deudaService;

    @Autowired
    private PagoMapper pagoMapper;

    public List<PagoResponseDTO> listarPorSocio(Long socioId) {
        return pagoRepository.findBySocioId(socioId)
                .stream()
                .map(pagoMapper::toDTO)
                .collect(Collectors.toList());
    }

    public PagoResponseDTO buscarPorId(Long id) {
        Pago pago = pagoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pago no encontrado con id: " + id));
        return pagoMapper.toDTO(pago);
    }

    @Transactional
    public PagoResponseDTO registrarPago(PagoRequestDTO dto) {
        Socio socio = socioService.obtenerEntidad(dto.getSocioId());

        // Obtener los ítems a pagar que estén PENDIENTES
        List<DeudaItem> items = deudaItemRepository.findByIdInAndEstado(
                dto.getDeudaItemIds(), EstadoItem.PENDIENTE);

        if (items.size() != dto.getDeudaItemIds().size()) {
            throw new RuntimeException("Algunos ítems no existen o ya fueron pagados");
        }

        // Calcular total del pago
        BigDecimal total = items.stream()
                .map(DeudaItem::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Marcar cada ítem como PAGADO
        items.forEach(item -> item.setEstado(EstadoItem.PAGADO));
        deudaItemRepository.saveAll(items);

        // Recalcular estado de cada deuda afectada
        items.stream()
                .map(DeudaItem::getDeuda)
                .distinct()
                .forEach(deudaService::recalcularEstado);

        // Registrar pago
        Pago pago = Pago.builder()
                .socio(socio)
                .fecha(LocalDate.now())
                .montoTotal(total)
                .itemsPagados(items)
                .observacion(dto.getObservacion())
                .build();

        return pagoMapper.toDTO(pagoRepository.save(pago));
    }
}
