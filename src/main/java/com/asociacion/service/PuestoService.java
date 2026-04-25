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
        if (puestoRepository.existsByNumero(dto.getNumero())) {
            throw new RuntimeException("Ya existe un puesto con el número: " + dto.getNumero());
        }

        Puesto puesto = puestoMapper.toModel(dto);

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

        puesto.setNumero(dto.getNumero());
        puesto.setDescripcion(dto.getDescripcion());

        if (dto.getSocioId() != null) {
            Socio socio = socioService.obtenerEntidad(dto.getSocioId());
            puesto.setSocio(socio);
        } else {
            puesto.setSocio(null); // pasa a ser de la asociación
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
