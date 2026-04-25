package com.asociacion.mapper;

import com.asociacion.dto.DeudaItemResponseDTO;
import com.asociacion.dto.DeudaResponseDTO;
import com.asociacion.model.Deuda;
import com.asociacion.model.DeudaItem;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class DeudaMapper {

    public DeudaResponseDTO toDTO(Deuda deuda) {
        List<DeudaItemResponseDTO> itemsDTO = deuda.getItems() != null
                ? deuda.getItems().stream().map(this::itemToDTO).collect(Collectors.toList())
                : List.of();

        return DeudaResponseDTO.builder()
                .id(deuda.getId())
                .socioId(deuda.getSocio().getId())
                .socioNombre(deuda.getSocio().getNombre() + " " + deuda.getSocio().getApellido())
                .fecha(deuda.getFecha())
                .descripcion(deuda.getDescripcion())
                .estado(deuda.getEstado())
                .totalPendiente(deuda.getTotalDeuda())
                .items(itemsDTO)
                .build();
    }

    public DeudaItemResponseDTO itemToDTO(DeudaItem item) {
        return DeudaItemResponseDTO.builder()
                .id(item.getId())
                .motivoCobroId(item.getMotivoCobro().getId())
                .motivoCobroNombre(item.getMotivoCobro().getNombre())
                .monto(item.getMonto())
                .observacion(item.getObservacion())
                .estado(item.getEstado())
                .build();
    }
}
