package com.asociacion.service;

import com.asociacion.dto.UsuarioRequestDTO;
import com.asociacion.dto.UsuarioResponseDTO;
import com.asociacion.mapper.UsuarioMapper;
import com.asociacion.model.Usuario;
import com.asociacion.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private UsuarioMapper usuarioMapper;

    public List<UsuarioResponseDTO> listarTodos() {
        return usuarioRepository.findAll()
                .stream()
                .map(usuarioMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<UsuarioResponseDTO> listarActivos() {
        return usuarioRepository.findByActivoTrue()
                .stream()
                .map(usuarioMapper::toDTO)
                .collect(Collectors.toList());
    }

    public UsuarioResponseDTO buscarPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + id));
        return usuarioMapper.toDTO(usuario);
    }

    @Transactional
    public UsuarioResponseDTO crear(UsuarioRequestDTO dto) {
        if (dto.getPassword() == null || dto.getPassword().isBlank()) {
            throw new RuntimeException("La contrasena es obligatoria");
        }
        if (usuarioRepository.existsByUsername(dto.getUsername())) {
            throw new RuntimeException("Ya existe un usuario con el username: " + dto.getUsername());
        }
        if (usuarioRepository.existsByDni(dto.getDni())) {
            throw new RuntimeException("Ya existe un usuario con el DNI: " + dto.getDni());
        }
        if (usuarioRepository.existsByRuc(dto.getRuc())) {
            throw new RuntimeException("Ya existe un usuario con el RUC: " + dto.getRuc());
        }
        if (dto.getEmail() != null && !dto.getEmail().isBlank()
                && usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Ya existe un usuario con el email: " + dto.getEmail());
        }
        Usuario usuario = usuarioMapper.toModel(dto);
        return usuarioMapper.toDTO(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponseDTO actualizar(Long id, UsuarioRequestDTO dto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + id));
        usuarioMapper.updateModel(usuario, dto);
        return usuarioMapper.toDTO(usuarioRepository.save(usuario));
    }

    @Transactional
    public void desactivar(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + id));
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void eliminar(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + id));
        usuario.setFlg(false);
        usuarioRepository.save(usuario);
    }

    public Usuario obtenerEntidad(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + id));
    }
}
