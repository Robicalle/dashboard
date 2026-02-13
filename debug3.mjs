import sql from 'mssql';
const config = { server: '192.168.2.2', port: 63068, database: 'PRINT', user: 'abc14a98b32f4365a3240f3b9e7bd4d3', password: 'b179f182-a722-4e03-aaa3-725e7c55073a', options: { encrypt: false, trustServerCertificate: true, connectTimeout: 30000, requestTimeout: 30000 } };
await sql.connect(config);

// Check proforma field
const r = await sql.query("SELECT DISTINCT tm_causale, tm_proforma, COUNT(*) as cnt FROM testmag WHERE tm_anno = 2026 GROUP BY tm_causale, tm_proforma ORDER BY tm_causale");
console.log('Causali 2026:', JSON.stringify(r.recordset));

// Check if there's a proforma-specific flag
const r2 = await sql.query("SELECT TOP 20 tm_causale, tm_proforma, tm_numdoc, tm_datdoc, tm_totdoc, tm_conto FROM testmag WHERE tm_anno = 2026 AND tm_proforma <> 0 ORDER BY tm_datdoc DESC");
console.log('Proforma docs:', JSON.stringify(r2.recordset));

await sql.close();
