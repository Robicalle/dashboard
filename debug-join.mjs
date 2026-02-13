import sql from 'mssql';
const config = { server: '192.168.2.2', port: 63068, database: 'PRINT', user: 'abc14a98b32f4365a3240f3b9e7bd4d3', password: 'b179f182-a722-4e03-aaa3-725e7c55073a', options: { encrypt: false, trustServerCertificate: true, connectTimeout: 30000, requestTimeout: 30000 } };
await sql.connect(config);

// Check top codcli feb
const r = await sql.query("SELECT TOP 5 tm_codcli, SUM(tm_totdoc) as totale FROM testmag WHERE tm_causale = 20 AND tm_anno = 2026 AND MONTH(tm_datdoc) = 2 GROUP BY tm_codcli ORDER BY totale DESC");
console.log('Top codcli feb:', JSON.stringify(r.recordset));

// Check anagra an_conto type
const r2 = await sql.query("SELECT TOP 1 an_conto, an_codanag, an_descr1 FROM anagra WHERE an_conto = '" + r.recordset[0].tm_codcli + "'");
console.log('Direct match:', JSON.stringify(r2.recordset));

// Try RTRIM join
const r3 = await sql.query("SELECT TOP 5 a.an_descr1, SUM(tm.tm_totdoc) as totale FROM testmag tm JOIN anagra a ON tm.tm_codcli = a.an_codanag WHERE tm.tm_causale = 20 AND tm.tm_anno = 2026 AND MONTH(tm.tm_datdoc) = 2 GROUP BY a.an_descr1 ORDER BY totale DESC");
console.log('Join via an_codanag:', JSON.stringify(r3.recordset));

await sql.close();
