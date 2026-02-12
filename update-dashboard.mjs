import sql from 'mssql';
import { writeFileSync } from 'fs';

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

async function update() {
  try {
    await sql.connect(config);
    console.log('✅ Connected to DB');

    // 1. Fatturato 2026 YTD (causale 20 = fatture vendita)
    const fatturato = await sql.query`
      SELECT 
        ISNULL(SUM(tm_totdoc), 0) as totale,
        ISNULL(SUM(CASE WHEN MONTH(tm_datdoc) = MONTH(GETDATE()) THEN tm_totdoc ELSE 0 END), 0) as totale_mese
      FROM testmag 
      WHERE tm_causale = 20 
        AND tm_anno = 2026
    `;
    const fatturato2026 = Math.round(fatturato.recordset[0].totale);
    const fatturatoMese = Math.round(fatturato.recordset[0].totale_mese);
    console.log(`📊 Fatturato 2026 YTD: €${fatturato2026}`);
    console.log(`📊 Fatturato mese corrente: €${fatturatoMese}`);

    // 2. Macchine vendute 2026 (gruppo articolo = macchine, cerco gruppi tipici)
    const macchine = await sql.query`
      SELECT COUNT(DISTINCT mm.mm_numdoc) as count_docs,
             ISNULL(SUM(mm.mm_valore), 0) as totale
      FROM movmag mm
      JOIN testmag tm ON mm.mm_numdoc = tm.tm_numdoc 
        AND mm.codditt = tm.codditt 
        AND mm.mm_serie = tm.tm_serie 
        AND mm.mm_anno = tm.tm_anno
        AND mm.mm_tipork = tm.tm_tipork
      JOIN artico ar ON mm.mm_codart = ar.ar_codart
      WHERE tm.tm_causale = 20
        AND tm.tm_anno = 2026
        AND (ar.ar_gruppo = 10 OR ar.ar_descr LIKE '%macchina%' OR ar.ar_descr LIKE '%printer%' OR ar.ar_descr LIKE '%plotter%' OR ar.ar_descr LIKE '%stampant%')
    `;
    const macchineVendute = macchine.recordset[0].count_docs;
    const macchineValore = Math.round(macchine.recordset[0].totale);
    console.log(`🖨️ Macchine vendute: ${macchineVendute} (€${macchineValore})`);

    // 3. Top clienti mese corrente (tm_conto = an_conto)
    const topClienti = await sql.query`
      SELECT TOP 10 
        a.an_descr1 as nome,
        SUM(tm.tm_totdoc) as totale
      FROM testmag tm
      JOIN anagra a ON tm.tm_conto = a.an_conto
      WHERE tm.tm_causale = 20
        AND tm.tm_anno = 2026
        AND MONTH(tm.tm_datdoc) = MONTH(GETDATE())
        AND YEAR(tm.tm_datdoc) = 2026
      GROUP BY a.an_descr1
      ORDER BY totale DESC
    `;
    console.log(`👥 Top ${topClienti.recordset.length} clienti mese:`);
    topClienti.recordset.forEach(c => console.log(`  - ${c.nome}: €${Math.round(c.totale)}`));

    // 4. Pipeline/proforma aperte (causale proforma - tipicamente 26 o simili)
    // Cerco documenti proforma non ancora fatturati
    const proforma = await sql.query`
      SELECT 
        a.an_descr1 as cliente,
        tm.tm_numdoc as doc,
        tm.tm_datdoc as data,
        tm.tm_totdoc as totale
      FROM testmag tm
      LEFT JOIN anagra a ON tm.tm_conto = a.an_conto
      WHERE tm.tm_causale = 24
        AND tm.tm_anno = 2026
      ORDER BY tm.tm_datdoc DESC
    `;
    
    const pipelineCount = proforma.recordset.length;
    const pipelineValore = Math.round(proforma.recordset.reduce((s, r) => s + (r.totale || 0), 0));
    console.log(`📋 Proforma aperte: ${pipelineCount} (€${pipelineValore})`);

    // Build dashboard data
    const data = {
      lastUpdate: new Date().toISOString(),
      fatturato2026,
      fatturatoMese,
      macchineVendute,
      macchineValore,
      pipelineCount,
      pipelineValore,
      topClienti: topClienti.recordset.map(c => ({ nome: c.nome, totale: Math.round(c.totale) })),
      proforma: proforma.recordset.map(p => ({
        cliente: p.cliente,
        doc: p.doc,
        data: p.data,
        totale: Math.round(p.totale || 0)
      })),
      leads: { total: pipelineCount, highPriority: 0 }
    };

    writeFileSync('C:\\Users\\Jarvis\\Desktop\\dashboard\\dashboard_data.json', JSON.stringify(data, null, 2));
    console.log('\n✅ dashboard_data.json aggiornato!');
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('❌ Errore:', err.message);
    if (err.message.includes('anagra')) {
      console.log('\n🔧 Provo a verificare la tabella anagrafica...');
      try {
        // Check actual table name
        const tables = await sql.query`
          SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_NAME LIKE '%anag%' OR TABLE_NAME LIKE '%clienti%'
          ORDER BY TABLE_NAME
        `;
        console.log('Tabelle trovate:', tables.recordset.map(t => t.TABLE_NAME));
      } catch (e2) {
        console.error('Errore check tabelle:', e2.message);
      }
    }
  } finally {
    await sql.close();
  }
}

update();
