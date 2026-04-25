package com.asociacion.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PagoRequestDTO {

    @NotNull(message = "El socio es obligatorio")
    private Long socioId;

    // Lista de IDs de DeudaItem a pagar (se pagan completos, no parcial)
    @NotEmpty(message = "Debe seleccionar al menos un ítem a pagar")
    private List<Long> deudaItemIds;

    private String observacion;
}
