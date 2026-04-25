package com.asociacion.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PuestoRequestDTO {

    @NotNull(message = "La categoria es obligatoria")
    @Min(value = 1, message = "Categoria no valida")
    @Max(value = 10, message = "Categoria no valida")
    private Integer categoria;

    private String descripcion;

    private Long socioId;
}
