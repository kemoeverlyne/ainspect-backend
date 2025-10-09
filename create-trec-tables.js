import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  console.error('DATABASE_URL must be set');
  process.exit(1);
}

async function createTRECTables() {
  const postgresClient = postgres(DATABASE_URL);
  const db = drizzle(postgresClient);

  try {
    console.log('Creating TREC tables...');

    // Create trec_inspections table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS trec_inspections (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        client_name VARCHAR NOT NULL,
        inspection_date TIMESTAMP NOT NULL,
        property_address TEXT NOT NULL,
        inspector_name VARCHAR NOT NULL,
        trec_license_number VARCHAR NOT NULL,
        sponsor_name VARCHAR,
        sponsor_trec_license_number VARCHAR,
        inspector_id VARCHAR NOT NULL REFERENCES users(id),
        status VARCHAR DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'in_progress', 'completed', 'submitted')),
        completed_sections JSONB,
        total_photos INTEGER DEFAULT 0,
        company_data JSONB,
        warranty_data JSONB,
        inspection_data JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        completed_at TIMESTAMP
      )
    `);

    // Create trec_audit_trail table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS trec_audit_trail (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        inspection_id VARCHAR NOT NULL REFERENCES trec_inspections(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        action VARCHAR NOT NULL,
        section VARCHAR,
        details JSONB,
        previous_value TEXT,
        new_value TEXT,
        ip_address VARCHAR,
        user_agent TEXT,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create trec_section_items table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS trec_section_items (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        inspection_id VARCHAR NOT NULL REFERENCES trec_inspections(id) ON DELETE CASCADE,
        major_section VARCHAR NOT NULL,
        major_section_title VARCHAR NOT NULL,
        minor_section VARCHAR NOT NULL,
        minor_section_title VARCHAR NOT NULL,
        rating VARCHAR CHECK (rating IN ('I', 'NI', 'NP', 'D')),
        foundation_type VARCHAR,
        roof_types JSONB,
        viewed_from VARCHAR,
        wiring_type VARCHAR,
        system_types JSONB,
        energy_sources JSONB,
        insulation_depth VARCHAR,
        water_meter_location VARCHAR,
        main_valve_location VARCHAR,
        static_pressure_reading VARCHAR,
        supply_piping_type VARCHAR,
        drain_piping_type VARCHAR,
        capacity VARCHAR,
        gas_meter_location VARCHAR,
        gas_piping_type VARCHAR,
        construction_type VARCHAR,
        pump_type VARCHAR,
        storage_equipment VARCHAR,
        system_type VARCHAR,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create trec_photos table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS trec_photos (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        inspection_id VARCHAR NOT NULL REFERENCES trec_inspections(id) ON DELETE CASCADE,
        section_item_id VARCHAR REFERENCES trec_section_items(id) ON DELETE CASCADE,
        filename VARCHAR NOT NULL,
        original_filename VARCHAR NOT NULL,
        file_path VARCHAR NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type VARCHAR NOT NULL,
        width INTEGER,
        height INTEGER,
        caption TEXT,
        uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create trec_rooms table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS trec_rooms (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        inspection_id VARCHAR NOT NULL REFERENCES trec_inspections(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        type VARCHAR NOT NULL CHECK (type IN ('bedroom', 'bathroom', 'living-room', 'kitchen', 'garage', 'basement', 'attic', 'office', 'utility', 'exterior', 'roof', 'electrical-panel', 'hvac-system', 'custom')),
        floor VARCHAR,
        notes TEXT,
        inspection_items JSONB,
        is_completed BOOLEAN DEFAULT FALSE,
        photos_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    console.log('✅ TREC tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating TREC tables:', error);
    throw error;
  } finally {
    await postgresClient.end();
  }
}

createTRECTables()
  .then(() => {
    console.log('Database setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database setup failed:', error);
    process.exit(1);
  });
