package com.asociacion.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "puestos")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Puesto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String numero;

    @Column
    private String descripcion;

    @Column(nullable = false)
    private Boolean activo = true;

    // Dueño puede ser un socio (nullable = true cuando es propiedad de la asociación)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_id", nullable = true)
    private Socio socio;

    // Si socio es null, el puesto pertenece a la asociación
    public boolean esDeAsociacion() {
        return this.socio == null;
    }
}
