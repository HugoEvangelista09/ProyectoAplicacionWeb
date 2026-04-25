package com.asociacion.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DeudaRequestDTO {

    @NotNull(message = "El socio es obligatorio")
    private Long socioId;

    private LocalDate fecha;

    private String descripcion;

    @NotEmpty(message = "La deuda debe tener al menos un ítem")
    @Valid
    private List<DeudaItemRequestDTO> items;
}
