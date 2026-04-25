package com.asociacion.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class MotivoCobroRequestDTO {

    @NotBlank(message = "El nombre del motivo es obligatorio")
    private String nombre;

    private String descripcion;
}
