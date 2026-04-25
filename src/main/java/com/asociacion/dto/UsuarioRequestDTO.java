package com.asociacion.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UsuarioRequestDTO {

    @NotBlank(message = "El username es obligatorio")
    private String username;

    private String password;

    @NotBlank(message = "El nombre completo es obligatorio")
    private String nombreCompleto;

    @NotBlank(message = "El DNI es obligatorio")
    @Size(min = 8, max = 8, message = "El DNI debe tener exactamente 8 caracteres")
    private String dni;

    @NotBlank(message = "El RUC es obligatorio")
    @Size(min = 11, max = 11, message = "El RUC debe tener exactamente 11 caracteres")
    private String ruc;

    @Email(message = "El email no tiene un formato valido")
    private String email;

    private String telefono;
    private String direccion;

    @NotNull(message = "El rol es obligatorio")
    private Integer rol;
}
