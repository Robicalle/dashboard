import sql from 'mssql';

const config = {
  server: '192.168.2.2',
  port: 63068,
  database: 'PRINT',
  user: 'abc14a98b32f4365a3240f3b9e7bd4d3',
  password: 'b179f182-a722-4e03-aaa3-725e7c55073a',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 30000,
    requestTimeout: 30000
  }
};

async function query() {
  try {
    await sql.connect(config);
    
    const conto = '11011196'; // SCATOLIFICIO ITALIANO SPADA SRL
    
    // Cerca ultimi acquisti in generale
    console.log('🔍 Ultimi acquisti SCATOLIFICIO ITALIANO SPADA SRL:\n');
    
    const ultimiAcquisti = await sql.query`
      SELECT TOP 20
        tm.tm_datdoc,
        tm.tm_numdoc,
        ar.ar_codart,
        ar.ar_descr,
        ar.ar_gruppo,
        mm.mm_quant,
        mm.mm_valore
      FROM movmag mm
      JOIN testmag tm ON mm.mm_numdoc = tm.tm_numdoc 
        AND mm.codditt = tm.codditt 
        AND mm.mm_serie = tm.tm_serie 
        AND mm.mm_anno = tm.tm_anno
        AND mm.mm_tipork = tm.tm_tipork
      LEFT JOIN artico ar ON mm.mm_codart = ar.ar_codart
      WHERE tm.tm_causale = 20
        AND tm.tm_codcli = ${conto}
        AND mm.mm_codart <> 'ANTICIPO'
      ORDER BY tm.tm_datdoc DESC
    `;
    
    if (ultimiAcquisti.recordset.length === 0) {
      console.log('❌ Nessun acquisto trovato');
      return;
    }
    
    console.log('✅ Ultimi 20 acquisti:');
    ultimiAcquisti.recordset.forEach(acq => {
      const data = new Date(acq.tm_datdoc).toLocaleDateString('it-IT');
      console.log(`  📅 ${data} | ${acq.ar_codart || 'N/A'} - ${acq.ar_descr || 'N/A'} | Gr:${acq.ar_gruppo || 'N/A'} | Qty:${acq.mm_quant} | €${acq.mm_valore.toFixed(2)}`);
    });
    
    // Raggruppa per gruppo articolo
    console.log('\n📊 Acquisti per gruppo articolo:');
    const perGruppo = await sql.query`
      SELECT 
        ar.ar_gruppo,
        COUNT(*) as num_ordini,
        SUM(mm.mm_valore) as totale
      FROM movmag mm
      JOIN testmag tm ON mm.mm_numdoc = tm.tm_numdoc 
        AND mm.codditt = tm.codditt 
        AND mm.mm_serie = tm.tm_serie 
        AND mm.mm_anno = tm.tm_anno
        AND mm.mm_tipork = tm.tm_tipork
      LEFT JOIN artico ar ON mm.mm_codart = ar.ar_codart
      WHERE tm.tm_causale = 20
        AND tm.tm_codcli = ${conto}
        AND mm.mm_codart <> 'ANTICIPO'
      GROUP BY ar.ar_gruppo
      ORDER BY totale DESC
    `;
    
    perGruppo.recordset.forEach(g => {
      console.log(`  Gruppo ${g.ar_gruppo || 'N/A'}: ${g.num_ordini} ordini, €${g.totale.toFixed(2)}`);
    });
    
  } catch (err) {
    console.error('❌ Errore:', err.message);
  } finally {
    await sql.close();
  }
}

query();
