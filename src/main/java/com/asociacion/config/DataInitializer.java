package com.asociacion.config;

import com.asociacion.model.*;
import com.asociacion.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements ApplicationRunner {

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private SocioRepository socioRepository;
    @Autowired private PuestoRepository puestoRepository;
    @Autowired private MotivoCobroRepository motivoCobroRepository;
    @Autowired private DeudaRepository deudaRepository;
    @Autowired private DeudaItemRepository deudaItemRepository;
    @Autowired private PagoRepository pagoRepository;

    @Override
    public void run(ApplicationArguments args) {
        // Admin
        if (!usuarioRepository.existsByUsername("admin")) {
            usuarioRepository.save(Usuario.builder()
                .username("admin").password("admin123")
                .nombreCompleto("Administrador Principal")
                .dni("00000001").ruc("00000000001")
                .email("admin@apromec.pe").rol(1).activo(true).flg(true).build());
            System.out.println(">>> Usuario admin creado: admin / admin123");
        }

        // Skip if already seeded
        if (socioRepository.count() > 0) return;

        // 3 operadores (rol=2)
        String[][] ops = {
            {"operador1","oper1234","Carlos Torres Rios","11111111","20111111111","operador1@apromec.pe"},
            {"operador2","oper1234","Maria Lopez Vega","22222222","20222222222","operador2@apromec.pe"},
            {"operador3","oper1234","Jose Huanca Quispe","33333333","20333333333","operador3@apromec.pe"},
        };
        for (String[] op : ops) {
            usuarioRepository.save(Usuario.builder()
                .username(op[0]).password(op[1]).nombreCompleto(op[2])
                .dni(op[3]).ruc(op[4]).email(op[5]).rol(2).activo(true).flg(true).build());
        }

        // 10 socios con username/password
        String[][] sd = {
            {"Ana",     "Flores",    "44444441", "ana.flores",      "socio123", "987001001"},
            {"Luis",    "Ramirez",   "44444442", "luis.ramirez",    "socio123", "987001002"},
            {"Carmen",  "Mamani",    "44444443", "carmen.mamani",   "socio123", "987001003"},
            {"Pedro",   "Gutierrez", "44444444", "pedro.gutierrez", "socio123", "987001004"},
            {"Rosa",    "Condori",   "44444445", "rosa.condori",    "socio123", "987001005"},
            {"Juan",    "Ccama",     "44444446", "juan.ccama",      "socio123", "987001006"},
            {"Elena",   "Vargas",    "44444447", "elena.vargas",    "socio123", "987001007"},
            {"Miguel",  "Quispe",    "44444448", "miguel.quispe",   "socio123", "987001008"},
            {"Lucia",   "Puma",      "44444449", "lucia.puma",      "socio123", "987001009"},
            {"Roberto", "Apaza",     "44444450", "roberto.apaza",   "socio123", "987001010"},
        };
        List<Socio> socios = new ArrayList<>();
        for (String[] s : sd) {
            socios.add(socioRepository.save(Socio.builder()
                .nombre(s[0]).apellido(s[1]).dni(s[2])
                .username(s[3]).password(s[4]).telefono(s[5])
                .activo(true).build()));
        }

        // 50 puestos: 5 por categoria (10 categorias), asignados a socios distintos
        int si = 0;
        for (int cat = 1; cat <= 10; cat++) {
            String prefijo = Puesto.getPrefijo(cat);
            for (int n = 1; n <= 5; n++) {
                puestoRepository.save(Puesto.builder()
                    .numero(String.format("%s-%03d", prefijo, n))
                    .categoria(cat)
                    .descripcion(Puesto.getNombreCategoria(cat) + " - Puesto " + n)
                    .socio(socios.get(si++ % socios.size()))
                    .activo(true).build());
            }
        }

        // 10 motivos de cobro
        String[] nombresMotivos = {
            "Tardanza a asamblea", "Inasistencia a asamblea", "Consumo de agua",
            "Consumo de luz", "Cuota de mantenimiento", "Cuota extraordinaria",
            "Multa por incumplimiento de normas", "Servicio de limpieza",
            "Servicio de seguridad", "Multa administrativa"
        };
        BigDecimal[] montos = {
            new BigDecimal("20.00"), new BigDecimal("50.00"), new BigDecimal("30.00"),
            new BigDecimal("45.00"), new BigDecimal("80.00"), new BigDecimal("100.00"),
            new BigDecimal("60.00"), new BigDecimal("25.00"), new BigDecimal("35.00"),
            new BigDecimal("70.00")
        };
        List<MotivoCobro> motivos = new ArrayList<>();
        for (int i = 0; i < nombresMotivos.length; i++) {
            motivos.add(motivoCobroRepository.save(MotivoCobro.builder()
                .nombre(nombresMotivos[i]).activo(true).build()));
        }

        LocalDate inicioMes   = LocalDate.of(2026, 4, 1);
        LocalDate inicioAntes = LocalDate.of(2025, 11, 1);

        for (Socio socio : socios) {
            // 15 deudas PENDIENTE - mes actual, dias 1 al 15
            for (int d = 0; d < 15; d++) {
                MotivoCobro m = motivos.get(d % motivos.size());
                Deuda deuda = deudaRepository.save(Deuda.builder()
                    .socio(socio).fecha(inicioMes.plusDays(d))
                    .descripcion(m.getNombre())
                    .estado(Deuda.EstadoDeuda.PENDIENTE).build());
                deudaItemRepository.save(DeudaItem.builder()
                    .deuda(deuda).motivoCobro(m)
                    .monto(montos[d % montos.length])
                    .estado(EstadoItem.PENDIENTE).build());
            }

            // 50 deudas PAGADA (1 item cada una) para construir los 20 pagos
            // 20 pagos con patron (p%4)+1 items: 5*(1+2+3+4)=50 items total
            List<DeudaItem> pagados = new ArrayList<>();
            for (int i = 0; i < 50; i++) {
                MotivoCobro m = motivos.get(i % motivos.size());
                Deuda deuda = deudaRepository.save(Deuda.builder()
                    .socio(socio).fecha(inicioAntes.plusDays(i * 2))
                    .descripcion(m.getNombre())
                    .estado(Deuda.EstadoDeuda.PAGADA).build());
                pagados.add(deudaItemRepository.save(DeudaItem.builder()
                    .deuda(deuda).motivoCobro(m)
                    .monto(montos[i % montos.length])
                    .estado(EstadoItem.PAGADO).build()));
            }

            // 20 pagos con fechas distribuidas en los ultimos 5 meses
            int ptr = 0;
            for (int p = 0; p < 20; p++) {
                int count = (p % 4) + 1;
                List<DeudaItem> pagoItems = new ArrayList<>(pagados.subList(ptr, ptr + count));
                ptr += count;
                BigDecimal total = pagoItems.stream()
                    .map(DeudaItem::getMonto).reduce(BigDecimal.ZERO, BigDecimal::add);
                pagoRepository.save(Pago.builder()
                    .socio(socio)
                    .fecha(inicioAntes.plusDays(p * 7))
                    .montoTotal(total)
                    .itemsPagados(pagoItems)
                    .build());
            }
        }

        System.out.println(">>> Datos de prueba creados: 3 operadores, 10 socios, 50 puestos, 10 motivos, 150 deudas pendientes, 500 deudas pagadas, 200 pagos.");
    }
}
