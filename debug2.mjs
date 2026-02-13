import sql from 'mssql';
const config = { server: '192.168.2.2', port: 63068, database: 'PRINT', user: 'abc14a98b32f4365a3240f3b9e7bd4d3', password: 'b179f182-a722-4e03-aaa3-725e7c55073a', options: { encrypt: false, trustServerCertificate: true, connectTimeout: 30000, requestTimeout: 30000 } };
await sql.connect(config);

// Check testmag columns for client ref
const r = await sql.query("SELECT TOP 3 * FROM testmag WHERE tm_causale = 20 AND tm_anno = 2026 ORDER BY tm_datdoc DESC");
console.log('Testmag sample cols:', Object.keys(r.recordset[0]).join(', '));
// Show client-related fields
r.recordset.forEach(row => {
  const clientFields = {};
  for (const [k, v] of Object.entries(row)) {
    if (k.includes('cli') || k.includes('cod') || k.includes('conto') || k.includes('rag') || k.includes('descr')) {
      clientFields[k] = v;
    }
  }
  console.log('Client fields:', JSON.stringify(clientFields));
});

// Check anagra key fields
const a = await sql.query("SELECT TOP 3 an_codanag, an_conto, an_descr1, an_tipoanag FROM anagra WHERE an_conto LIKE '1101%'");
console.log('Anagra samples:', JSON.stringify(a.recordset));

await sql.close();
