function incidenciasDemo() {
    const inicio = '2026-11-09T08:00:00-05:00';
    const ejemplos = [
        ['84', 'Falla en maquinaria', 'La cosecha se detuvo por una falla en el equipo.', 30, 4],
        ['83', 'Retraso de material', 'Los materiales de cosecha llegaron con retraso.', 25, 5],
        ['64', 'Falla en maquinaria', 'La cuadrilla esperó el reemplazo del equipo.', 25, 6],
        ['82', 'Retraso de transporte', 'La cuadrilla esperó el transporte de la jornada.', 10, 5],
        ['81', 'Retraso de material', 'La entrega de insumos demoró el inicio de la actividad.', 15, 5],
        ['85', 'Falla del aplicativo', 'El registro de la cuadrilla se interrumpió temporalmente.', 12, 2],
        ['86', 'Retraso de transporte', 'El traslado al punto de trabajo se retrasó.', 12, 3]
    ];
    return ejemplos.map(([numero,tipo,descripcion,trabajadores,horas],index)=>{
        const parcela = `Parcela ${numero}`;
        return {
            id:`INC-DEMO-${String(index+1).padStart(2,'0')}`,
            parcela, area:'Cosecha', tipo, descripcion, trabajadores,
            inicio, fin:new Date(Date.parse(inicio)+horas*3600000).toISOString(), fechaRegistro:inicio,
            estado:'FINALIZADA', ubicacion:Parcelas.ubicacion(parcela), ubicacionEstado:'configurada'
        };
    });
}
