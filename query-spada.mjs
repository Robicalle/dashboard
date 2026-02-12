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
    
    // Cerca cliente Spada
    console.log('🔍 Ricerca cliente Spada...\n');
    const clienti = await sql.query`
      SELECT TOP 5 an_codanag, an_descr1, an_cognome, an_nome, an_conto
      FROM anagra 
      WHERE an_descr1 LIKE '%spada%' OR an_cognome LIKE '%spada%' OR an_nome LIKE '%spada%'
    `;
    
    if (clienti.recordset.length === 0) {
      console.log('❌ Nessun cliente trovato con nome "Spada"');
      return;
    }
    
    console.log('✅ Clienti trovati:');
    clienti.recordset.forEach(c => {
      console.log(`  - ${c.an_descr1} (Codice: ${c.an_codanag}, Conto: ${c.an_conto})`);
    });
    
    const cliente = clienti.recordset[0];
    const conto = cliente.an_conto;
    
    // Cerca ultimo acquisto inchiostri
    console.log(`\n🔍 Ricerca ultimo acquisto inchiostri per ${cliente.an_descr1}...\n`);
    
    const ultimoAcquisto = await sql.query`
      SELECT TOP 1 
        tm.tm_datdoc,
        tm.tm_numdoc,
        ar.ar_codart,
        ar.ar_descr,
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
        AND (ar.ar_descr LIKE '%inchiost%' OR ar.ar_descr LIKE '%ink%' OR ar.ar_descr LIKE '%cartuc%' OR ar.ar_gruppo = 40)
      ORDER BY tm.tm_datdoc DESC
    `;
    
    if (ultimoAcquisto.recordset.length === 0) {
      console.log('❌ Nessun acquisto di inchiostri trovato');
      return;
    }
    
    const acq = ultimoAcquisto.recordset[0];
    console.log('✅ Ultimo acquisto inchiostri:');
    console.log(`  📅 Data: ${new Date(acq.tm_datdoc).toLocaleDateString('it-IT')}`);
    console.log(`  📄 Documento: ${acq.tm_numdoc}`);
    console.log(`  🎨 Articolo: ${acq.ar_codart} - ${acq.ar_descr}`);
    console.log(`  📦 Quantità: ${acq.mm_quant}`);
    console.log(`  💰 Valore: €${acq.mm_valore.toFixed(2)}`);
    
  } catch (err) {
    console.error('❌ Errore:', err.message);
  } finally {
    await sql.close();
  }
}

query();
