package com.asociacion.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "puestos")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Puesto {

    private static final String[] PREFIJOS = {
        "NAT", "ABA", "PLA", "POL", "CAR", "FER", "ROP", "VER", "PES", "RES"
    };

    private static final String[] NOMBRES = {
        "Naturista", "Abarrotes", "Plasticos", "Pollos", "Carnes",
        "Ferreteria", "Ropa", "Verduras", "Pescados", "Restaurantes"
    };

    public static String getPrefijo(int categoria) {
        if (categoria < 1 || categoria > PREFIJOS.length) return "GEN";
        return PREFIJOS[categoria - 1];
    }

    public static String getNombreCategoria(int categoria) {
        if (categoria < 1 || categoria > NOMBRES.length) return "General";
        return NOMBRES[categoria - 1];
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String numero;

    @Column(nullable = false)
    private Integer categoria;

    @Column
    private String descripcion;

    @Column(nullable = false)
    private Boolean activo = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_id", nullable = true)
    private Socio socio;

    public boolean esDeAsociacion() {
        return this.socio == null;
    }
}
