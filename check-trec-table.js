import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function checkTable() {
  try {
    // Check if table exists
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'trec_inspections'
      );
    `;
    
    console.log('✓ Database connection successful');
    console.log('trec_inspections table exists:', result[0].exists);
    
    if (result[0].exists) {
      // Get table structure
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'trec_inspections'
        ORDER BY ordinal_position;
      `;
      
      console.log('\nTable structure:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
      });
    } else {
      console.log('\n❌ Table does not exist! Need to run create-trec-tables.js');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await sql.end();
  }
}

checkTable();


