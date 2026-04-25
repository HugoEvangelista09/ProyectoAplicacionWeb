package com.asociacion.mapper;

import com.asociacion.dto.UsuarioRequestDTO;
import com.asociacion.dto.UsuarioResponseDTO;
import com.asociacion.model.Usuario;
import org.springframework.stereotype.Component;

@Component
public class UsuarioMapper {

    public Usuario toModel(UsuarioRequestDTO dto) {
        return Usuario.builder()
                .username(dto.getUsername())
                .password(dto.getPassword())
                .nombreCompleto(dto.getNombreCompleto())
                .dni(dto.getDni())
                .ruc(dto.getRuc())
                .email(dto.getEmail())
                .telefono(dto.getTelefono())
                .direccion(dto.getDireccion())
                .activo(true)
                .flg(true)
                .rol(dto.getRol())
                .build();
    }

    public UsuarioResponseDTO toDTO(Usuario usuario) {
        return UsuarioResponseDTO.builder()
                .id(usuario.getId())
                .username(usuario.getUsername())
                .nombreCompleto(usuario.getNombreCompleto())
                .dni(usuario.getDni())
                .ruc(usuario.getRuc())
                .email(usuario.getEmail())
                .telefono(usuario.getTelefono())
                .direccion(usuario.getDireccion())
                .activo(usuario.getActivo())
                .flg(usuario.getFlg())
                .rol(usuario.getRol())
                .createdAt(usuario.getCreatedAt())
                .updatedAt(usuario.getUpdatedAt())
                .build();
    }

    public void updateModel(Usuario usuario, UsuarioRequestDTO dto) {
        usuario.setUsername(dto.getUsername());
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            usuario.setPassword(dto.getPassword());
        }
        usuario.setNombreCompleto(dto.getNombreCompleto());
        usuario.setDni(dto.getDni());
        usuario.setRuc(dto.getRuc());
        usuario.setEmail(dto.getEmail());
        usuario.setTelefono(dto.getTelefono());
        usuario.setDireccion(dto.getDireccion());
        usuario.setRol(dto.getRol());
    }
}
