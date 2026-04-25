package com.asociacion.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DeudaMasivaRequestDTO {

    // Lista de socios a los que se generará la misma deuda
    @NotEmpty(message = "Debe indicar al menos un socio")
    private List<Long> socioIds;

    // Los ítems que tendrá cada deuda generada
    @NotEmpty(message = "La deuda debe tener al menos un ítem")
    @Valid
    private List<DeudaItemRequestDTO> items;

    private String descripcion;
}
