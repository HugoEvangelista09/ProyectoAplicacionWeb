package com.asociacion.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class MotivoCobroResponseDTO {
    private Long id;
    private String nombre;
    private String descripcion;
    private Boolean activo;
}
