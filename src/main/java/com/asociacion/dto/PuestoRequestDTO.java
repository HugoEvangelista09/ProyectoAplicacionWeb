package com.asociacion.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PuestoRequestDTO {

    @NotBlank(message = "El número de puesto es obligatorio")
    private String numero;

    private String descripcion;

    // null = pertenece a la asociación
    private Long socioId;
}
