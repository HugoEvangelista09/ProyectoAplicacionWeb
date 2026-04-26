package com.asociacion.service;

import com.asociacion.dto.*;
import com.asociacion.mapper.DeudaMapper;
import com.asociacion.model.*;
import com.asociacion.repository.DeudaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DeudaService {

    @Autowired
    private DeudaRepository deudaRepository;

    @Autowired
    private SocioService socioService;

    @Autowired
    private MotivoCobroService motivoCobroService;

    @Autowired
    private DeudaMapper deudaMapper;

    public List<DeudaResponseDTO> listarTodas() {
        return deudaRepository.findAll()
                .stream()
                .map(deudaMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<DeudaResponseDTO> listarPorSocio(Long socioId) {
        return deudaRepository.findBySocioId(socioId)
                .stream()
                .map(deudaMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<DeudaResponseDTO> listarPendientesPorSocio(Long socioId) {
        return deudaRepository.findBySocioIdAndEstado(socioId, Deuda.EstadoDeuda.PENDIENTE)
                .stream()
                .map(deudaMapper::toDTO)
                .collect(Collectors.toList());
    }

    public DeudaResponseDTO buscarPorId(Long id) {
        Deuda deuda = deudaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deuda no encontrada con id: " + id));
        return deudaMapper.toDTO(deuda);
    }

    @Transactional
    public DeudaResponseDTO crear(DeudaRequestDTO dto) {
        Socio socio = socioService.obtenerEntidad(dto.getSocioId());
        Deuda deuda = buildDeuda(socio, dto.getDescripcion(), dto.getItems());
        return deudaMapper.toDTO(deudaRepository.save(deuda));
    }

    // Carga masiva: genera la misma deuda para múltiples socios
    @Transactional
    public List<DeudaResponseDTO> crearMasivo(DeudaMasivaRequestDTO dto) {
        List<DeudaResponseDTO> resultado = new ArrayList<>();

        for (Long socioId : dto.getSocioIds()) {
            Socio socio = socioService.obtenerEntidad(socioId);
            Deuda deuda = buildDeuda(socio, dto.getDescripcion(), dto.getItems());
            resultado.add(deudaMapper.toDTO(deudaRepository.save(deuda)));
        }

        return resultado;
    }

    private Deuda buildDeuda(Socio socio, String descripcion, List<DeudaItemRequestDTO> itemsDTO) {
        Deuda deuda = Deuda.builder()
                .socio(socio)
                .fecha(LocalDate.now())
                .descripcion(descripcion)
                .estado(Deuda.EstadoDeuda.PENDIENTE)
                .build();

        List<DeudaItem> items = itemsDTO.stream().map(itemDTO -> {
            MotivoCobro motivo = motivoCobroService.obtenerEntidad(itemDTO.getMotivoCobroId());
            return DeudaItem.builder()
                    .deuda(deuda)
                    .motivoCobro(motivo)
                    .monto(itemDTO.getMonto())
                    .observacion(itemDTO.getObservacion())
                    .estado(EstadoItem.PENDIENTE)
                    .build();
        }).collect(Collectors.toList());

        deuda.setItems(items);
        return deuda;
    }

    // Recalcula estado de la deuda según sus items
    public void recalcularEstado(Deuda deuda) {
        long totalItems = deuda.getItems().size();
        long itemsPagados = deuda.getItems().stream()
                .filter(i -> i.getEstado() == EstadoItem.PAGADO)
                .count();

        if (itemsPagados == totalItems) {
            deuda.setEstado(Deuda.EstadoDeuda.PAGADA);
        } else {
            deuda.setEstado(Deuda.EstadoDeuda.PENDIENTE);
        }
        deudaRepository.save(deuda);
    }

    @Transactional
    public DeudaResponseDTO agregarItems(Long deudaId, List<DeudaItemRequestDTO> itemsDTO) {
        Deuda deuda = obtenerEntidad(deudaId);
        List<DeudaItem> nuevos = itemsDTO.stream().map(dto -> {
            MotivoCobro motivo = motivoCobroService.obtenerEntidad(dto.getMotivoCobroId());
            return DeudaItem.builder()
                    .deuda(deuda)
                    .motivoCobro(motivo)
                    .monto(dto.getMonto())
                    .observacion(dto.getObservacion())
                    .estado(EstadoItem.PENDIENTE)
                    .build();
        }).collect(Collectors.toList());
        deuda.getItems().addAll(nuevos);
        deuda.setEstado(Deuda.EstadoDeuda.PENDIENTE);
        return deudaMapper.toDTO(deudaRepository.save(deuda));
    }

    public List<DeudaResponseDTO> buscar(String term) {
        return deudaRepository.buscar(term)
                .stream()
                .map(deudaMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<DeudaResponseDTO> buscarPorSocio(Long socioId, String term) {
        return deudaRepository.buscarPorSocio(socioId, term)
                .stream()
                .map(deudaMapper::toDTO)
                .collect(Collectors.toList());
    }

    public Deuda obtenerEntidad(Long id) {
        return deudaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deuda no encontrada con id: " + id));
    }
}
