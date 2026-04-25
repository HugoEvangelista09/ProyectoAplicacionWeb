package com.asociacion.mapper;

import com.asociacion.dto.MotivoCobroRequestDTO;
import com.asociacion.dto.MotivoCobroResponseDTO;
import com.asociacion.model.MotivoCobro;
import org.springframework.stereotype.Component;

@Component
public class MotivoCobroMapper {

    public MotivoCobro toModel(MotivoCobroRequestDTO dto) {
        return MotivoCobro.builder()
                .nombre(dto.getNombre())
                .descripcion(dto.getDescripcion())
                .activo(true)
                .build();
    }

    public MotivoCobroResponseDTO toDTO(MotivoCobro motivo) {
        return MotivoCobroResponseDTO.builder()
                .id(motivo.getId())
                .nombre(motivo.getNombre())
                .descripcion(motivo.getDescripcion())
                .activo(motivo.getActivo())
                .build();
    }
}
