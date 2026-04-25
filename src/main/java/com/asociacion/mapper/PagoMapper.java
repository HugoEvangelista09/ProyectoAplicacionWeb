package com.asociacion.mapper;

import com.asociacion.dto.PagoResponseDTO;
import com.asociacion.model.Pago;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class PagoMapper {

    @Autowired
    private DeudaMapper deudaMapper;

    public PagoResponseDTO toDTO(Pago pago) {
        return PagoResponseDTO.builder()
                .id(pago.getId())
                .socioId(pago.getSocio().getId())
                .socioNombre(pago.getSocio().getNombre() + " " + pago.getSocio().getApellido())
                .fecha(pago.getFecha())
                .montoTotal(pago.getMontoTotal())
                .observacion(pago.getObservacion())
                .itemsPagados(pago.getItemsPagados() != null
                        ? pago.getItemsPagados().stream()
                            .map(deudaMapper::itemToDTO)
                            .collect(Collectors.toList())
                        : null)
                .build();
    }
}
