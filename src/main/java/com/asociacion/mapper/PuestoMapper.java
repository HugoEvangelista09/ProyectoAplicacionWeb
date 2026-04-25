package com.asociacion.mapper;

import com.asociacion.dto.PuestoRequestDTO;
import com.asociacion.dto.PuestoResponseDTO;
import com.asociacion.model.Puesto;
import org.springframework.stereotype.Component;

@Component
public class PuestoMapper {

    public Puesto toModel(PuestoRequestDTO dto) {
        return Puesto.builder()
                .categoria(dto.getCategoria())
                .descripcion(dto.getDescripcion())
                .activo(true)
                .build();
    }

    public PuestoResponseDTO toDTO(Puesto puesto) {
        return PuestoResponseDTO.builder()
                .id(puesto.getId())
                .numero(puesto.getNumero())
                .categoria(puesto.getCategoria())
                .categoriaNombre(Puesto.getNombreCategoria(puesto.getCategoria()))
                .descripcion(puesto.getDescripcion())
                .activo(puesto.getActivo())
                .socioId(puesto.getSocio() != null ? puesto.getSocio().getId() : null)
                .socioNombre(puesto.getSocio() != null
                        ? puesto.getSocio().getNombre() + " " + puesto.getSocio().getApellido()
                        : null)
                .esDeAsociacion(puesto.esDeAsociacion())
                .build();
    }

    public void updateModel(Puesto puesto, PuestoRequestDTO dto) {
        // numero y categoria son inmutables; solo descripcion cambia
        puesto.setDescripcion(dto.getDescripcion());
    }
}
