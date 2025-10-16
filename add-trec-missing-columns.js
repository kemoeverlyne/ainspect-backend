import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function addMissingColumns() {
  try {
    console.log('Adding missing JSONB columns to trec_inspections table...\n');
    
    // Add company_data column
    console.log('Adding company_data column...');
    await sql`
      ALTER TABLE trec_inspections 
      ADD COLUMN IF NOT EXISTS company_data JSONB;
    `;
    console.log('✓ company_data column added');
    
    // Add warranty_data column
    console.log('Adding warranty_data column...');
    await sql`
      ALTER TABLE trec_inspections 
      ADD COLUMN IF NOT EXISTS warranty_data JSONB;
    `;
    console.log('✓ warranty_data column added');
    
    // Add inspection_data column
    console.log('Adding inspection_data column...');
    await sql`
      ALTER TABLE trec_inspections 
      ADD COLUMN IF NOT EXISTS inspection_data JSONB;
    `;
    console.log('✓ inspection_data column added');
    
    console.log('\n✅ All missing columns added successfully!');
    
    // Verify the columns were added
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'trec_inspections'
      AND column_name IN ('company_data', 'warranty_data', 'inspection_data')
      ORDER BY column_name;
    `;
    
    console.log('\nVerification - New columns:');
    columns.forEach(col => {
      console.log(`  ✓ ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await sql.end();
  }
}

addMissingColumns();


