package com.asociacion.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "motivos_cobro")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class MotivoCobro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nombre;

    @Column
    private String descripcion;

    @Column(nullable = false)
    private Boolean activo = true;
}
