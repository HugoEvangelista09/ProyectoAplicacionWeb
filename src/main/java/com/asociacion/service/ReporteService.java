package com.asociacion.service;

import com.asociacion.dto.DeudaResponseDTO;
import com.asociacion.mapper.DeudaMapper;
import com.asociacion.mapper.PagoMapper;
import com.asociacion.dto.PagoResponseDTO;
import com.asociacion.repository.DeudaRepository;
import com.asociacion.repository.PagoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReporteService {

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired
    private DeudaRepository deudaRepository;

    @Autowired
    private PagoMapper pagoMapper;

    @Autowired
    private DeudaMapper deudaMapper;

    // Reporte de caja diario: pagos realizados en una fecha
    public Map<String, Object> reporteCajaDiario(LocalDate fecha) {
        List<PagoResponseDTO> pagos = pagoRepository.findByFecha(fecha)
                .stream()
                .map(pagoMapper::toDTO)
                .collect(Collectors.toList());

        BigDecimal totalRecaudado = pagos.stream()
                .map(PagoResponseDTO::getMontoTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
                "fecha", fecha.toString(),
                "totalRecaudado", totalRecaudado,
                "cantidadPagos", pagos.size(),
                "pagos", pagos
        );
    }

    // Reporte de caja por rango de fechas
    public Map<String, Object> reporteCajaRango(LocalDate desde, LocalDate hasta) {
        List<PagoResponseDTO> pagos = pagoRepository.findByFechaBetween(desde, hasta)
                .stream()
                .map(pagoMapper::toDTO)
                .collect(Collectors.toList());

        BigDecimal totalRecaudado = pagos.stream()
                .map(PagoResponseDTO::getMontoTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
                "desde", desde.toString(),
                "hasta", hasta.toString(),
                "totalRecaudado", totalRecaudado,
                "cantidadPagos", pagos.size(),
                "pagos", pagos
        );
    }

    // Reporte de deudas pendientes agrupadas por socio
    public Map<String, Object> reporteDeudaPorSocio() {
        List<DeudaResponseDTO> deudas = deudaRepository.findAllDeudsPendientes()
                .stream()
                .map(deudaMapper::toDTO)
                .collect(Collectors.toList());

        // Agrupar por socio
        Map<String, List<DeudaResponseDTO>> porSocio = deudas.stream()
                .collect(Collectors.groupingBy(DeudaResponseDTO::getSocioNombre));

        // Calcular total por socio
        Map<String, BigDecimal> totalPorSocio = porSocio.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().stream()
                                .map(DeudaResponseDTO::getTotalPendiente)
                                .reduce(BigDecimal.ZERO, BigDecimal::add)
                ));

        BigDecimal totalGeneral = totalPorSocio.values()
                .stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
                "totalGeneral", totalGeneral,
                "deudaPorSocio", porSocio,
                "totalPorSocio", totalPorSocio
        );
    }
}
