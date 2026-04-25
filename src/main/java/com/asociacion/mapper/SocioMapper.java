package com.asociacion.mapper;

import com.asociacion.dto.SocioRequestDTO;
import com.asociacion.dto.SocioResponseDTO;
import com.asociacion.model.Socio;
import org.springframework.stereotype.Component;

@Component
public class SocioMapper {

    public Socio toModel(SocioRequestDTO dto) {
        return Socio.builder()
                .nombre(dto.getNombre())
                .apellido(dto.getApellido())
                .dni(dto.getDni())
                .telefono(dto.getTelefono())
                .email(dto.getEmail())
                .activo(true)
                .build();
    }

    public SocioResponseDTO toDTO(Socio socio) {
        return SocioResponseDTO.builder()
                .id(socio.getId())
                .nombre(socio.getNombre())
                .apellido(socio.getApellido())
                .dni(socio.getDni())
                .telefono(socio.getTelefono())
                .email(socio.getEmail())
                .activo(socio.getActivo())
                .build();
    }

    public void updateModel(Socio socio, SocioRequestDTO dto) {
        socio.setNombre(dto.getNombre());
        socio.setApellido(dto.getApellido());
        socio.setDni(dto.getDni());
        socio.setTelefono(dto.getTelefono());
        socio.setEmail(dto.getEmail());
    }
}
