package com.asociacion.service;

import com.asociacion.dto.SocioRequestDTO;
import com.asociacion.dto.SocioResponseDTO;
import com.asociacion.mapper.SocioMapper;
import com.asociacion.model.Socio;
import com.asociacion.repository.SocioRepository;
import com.asociacion.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SocioService {

    @Autowired
    private SocioRepository socioRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private SocioMapper socioMapper;

    public List<SocioResponseDTO> listarTodos() {
        return socioRepository.findAll()
                .stream()
                .map(socioMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<SocioResponseDTO> listarActivos() {
        return socioRepository.findByActivoTrue()
                .stream()
                .map(socioMapper::toDTO)
                .collect(Collectors.toList());
    }

    public SocioResponseDTO buscarPorId(Long id) {
        Socio socio = socioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Socio no encontrado con id: " + id));
        return socioMapper.toDTO(socio);
    }

    @Transactional
    public SocioResponseDTO crear(SocioRequestDTO dto) {
        if (socioRepository.existsByDni(dto.getDni()) || usuarioRepository.existsByDni(dto.getDni())) {
            throw new RuntimeException("Ya existe un registro con el DNI: " + dto.getDni());
        }
        if (dto.getUsername() != null && !dto.getUsername().isBlank()) {
            if (socioRepository.existsByUsername(dto.getUsername()) || usuarioRepository.existsByUsername(dto.getUsername())) {
                throw new RuntimeException("El username ya esta en uso: " + dto.getUsername());
            }
        }
        Socio socio = socioMapper.toModel(dto);
        return socioMapper.toDTO(socioRepository.save(socio));
    }

    @Transactional
    public SocioResponseDTO actualizar(Long id, SocioRequestDTO dto) {
        Socio socio = socioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Socio no encontrado con id: " + id));
        socioMapper.updateModel(socio, dto);
        return socioMapper.toDTO(socioRepository.save(socio));
    }

    @Transactional
    public void desactivar(Long id) {
        Socio socio = socioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Socio no encontrado con id: " + id));
        socio.setActivo(false);
        socioRepository.save(socio);
    }

    public List<SocioResponseDTO> buscar(String term) {
        return socioRepository.buscar(term)
                .stream()
                .map(socioMapper::toDTO)
                .collect(Collectors.toList());
    }

    // Método interno para uso en otros servicios
    public Socio obtenerEntidad(Long id) {
        return socioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Socio no encontrado con id: " + id));
    }
}
