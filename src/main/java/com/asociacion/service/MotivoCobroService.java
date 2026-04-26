package com.asociacion.service;

import com.asociacion.dto.MotivoCobroRequestDTO;
import com.asociacion.dto.MotivoCobroResponseDTO;
import com.asociacion.mapper.MotivoCobroMapper;
import com.asociacion.model.MotivoCobro;
import com.asociacion.repository.MotivoCobroRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MotivoCobroService {

    @Autowired
    private MotivoCobroRepository motivoCobroRepository;

    @Autowired
    private MotivoCobroMapper motivoCobroMapper;

    public List<MotivoCobroResponseDTO> listarActivos() {
        return motivoCobroRepository.findByActivoTrue()
                .stream()
                .map(motivoCobroMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<MotivoCobroResponseDTO> listarTodos() {
        return motivoCobroRepository.findAll()
                .stream()
                .map(motivoCobroMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public MotivoCobroResponseDTO crear(MotivoCobroRequestDTO dto) {
        if (motivoCobroRepository.existsByNombre(dto.getNombre())) {
            throw new RuntimeException("Ya existe un motivo de cobro con el nombre: " + dto.getNombre());
        }
        MotivoCobro motivo = motivoCobroMapper.toModel(dto);
        return motivoCobroMapper.toDTO(motivoCobroRepository.save(motivo));
    }

    @Transactional
    public MotivoCobroResponseDTO actualizar(Long id, MotivoCobroRequestDTO dto) {
        MotivoCobro motivo = motivoCobroRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Motivo de cobro no encontrado con id: " + id));
        motivo.setNombre(dto.getNombre());
        motivo.setDescripcion(dto.getDescripcion());
        return motivoCobroMapper.toDTO(motivoCobroRepository.save(motivo));
    }

    @Transactional
    public void desactivar(Long id) {
        MotivoCobro motivo = motivoCobroRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Motivo de cobro no encontrado con id: " + id));
        motivo.setActivo(false);
        motivoCobroRepository.save(motivo);
    }

    public List<MotivoCobroResponseDTO> buscar(String term) {
        return motivoCobroRepository.buscar(term)
                .stream()
                .map(motivoCobroMapper::toDTO)
                .collect(Collectors.toList());
    }

    // Método interno
    public MotivoCobro obtenerEntidad(Long id) {
        return motivoCobroRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Motivo de cobro no encontrado con id: " + id));
    }
}
