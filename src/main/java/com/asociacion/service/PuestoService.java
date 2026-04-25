package com.asociacion.service;

import com.asociacion.dto.PuestoRequestDTO;
import com.asociacion.dto.PuestoResponseDTO;
import com.asociacion.mapper.PuestoMapper;
import com.asociacion.model.Puesto;
import com.asociacion.model.Socio;
import com.asociacion.repository.PuestoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PuestoService {

    @Autowired
    private PuestoRepository puestoRepository;

    @Autowired
    private SocioService socioService;

    @Autowired
    private PuestoMapper puestoMapper;

    public List<PuestoResponseDTO> listarTodos() {
        return puestoRepository.findAll()
                .stream()
                .map(puestoMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<PuestoResponseDTO> listarPorSocio(Long socioId) {
        return puestoRepository.findBySocioId(socioId)
                .stream()
                .map(puestoMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<PuestoResponseDTO> listarDeLaAsociacion() {
        return puestoRepository.findBySocioIsNull()
                .stream()
                .map(puestoMapper::toDTO)
                .collect(Collectors.toList());
    }

    public PuestoResponseDTO buscarPorId(Long id) {
        Puesto puesto = puestoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Puesto no encontrado con id: " + id));
        return puestoMapper.toDTO(puesto);
    }

    @Transactional
    public PuestoResponseDTO crear(PuestoRequestDTO dto) {
        // Generar correlativo automatico por categoria (ej. NAT-001, NAT-002...)
        String prefijo = Puesto.getPrefijo(dto.getCategoria());
        long secuencia = puestoRepository.countByCategoria(dto.getCategoria());
        String numero;
        do {
            secuencia++;
            numero = String.format("%s-%03d", prefijo, secuencia);
        } while (puestoRepository.existsByNumero(numero));

        Puesto puesto = puestoMapper.toModel(dto);
        puesto.setNumero(numero);

        if (dto.getSocioId() != null) {
            Socio socio = socioService.obtenerEntidad(dto.getSocioId());
            puesto.setSocio(socio);
        }

        return puestoMapper.toDTO(puestoRepository.save(puesto));
    }

    @Transactional
    public PuestoResponseDTO actualizar(Long id, PuestoRequestDTO dto) {
        Puesto puesto = puestoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Puesto no encontrado con id: " + id));

        // numero y categoria son inmutables — solo descripcion y socio pueden cambiar
        puesto.setDescripcion(dto.getDescripcion());

        if (dto.getSocioId() != null) {
            Socio socio = socioService.obtenerEntidad(dto.getSocioId());
            puesto.setSocio(socio);
        } else {
            puesto.setSocio(null);
        }

        return puestoMapper.toDTO(puestoRepository.save(puesto));
    }

    @Transactional
    public void desactivar(Long id) {
        Puesto puesto = puestoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Puesto no encontrado con id: " + id));
        puesto.setActivo(false);
        puestoRepository.save(puesto);
    }
}
