package com.asociacion.mapper;

import com.asociacion.dto.PuestoRequestDTO;
import com.asociacion.dto.PuestoResponseDTO;
import com.asociacion.model.Puesto;
import org.springframework.stereotype.Component;

@Component
public class PuestoMapper {

    public Puesto toModel(PuestoRequestDTO dto) {
        return Puesto.builder()
                .numero(dto.getNumero())
                .descripcion(dto.getDescripcion())
                .activo(true)
                .build();
        // socio se asigna en el service
    }

    public PuestoResponseDTO toDTO(Puesto puesto) {
        return PuestoResponseDTO.builder()
                .id(puesto.getId())
                .numero(puesto.getNumero())
                .descripcion(puesto.getDescripcion())
                .activo(puesto.getActivo())
                .socioId(puesto.getSocio() != null ? puesto.getSocio().getId() : null)
                .socioNombre(puesto.getSocio() != null
                        ? puesto.getSocio().getNombre() + " " + puesto.getSocio().getApellido()
                        : null)
                .esDeAsociacion(puesto.esDeAsociacion())
                .build();
    }
}
