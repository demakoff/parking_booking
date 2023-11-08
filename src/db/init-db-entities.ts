import { Pool } from 'pg';
import createTable from './create-table';

export default async function initDBEntities(db: Pool) {
	try {
		const emailPattern =
			"^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$";
		await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_type') THEN
                    CREATE TYPE role_type AS ENUM ('standard', 'admin');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_type') THEN
                    CREATE DOMAIN email_type AS citext CHECK ( value ~ '${emailPattern}' );
                END IF;
            END $$;
        `);
		await db.query('CREATE EXTENSION IF NOT EXISTS btree_gist;');

		await createTable(
			db,
			'users',
			`id SERIAL PRIMARY KEY, 
            first_name VARCHAR(30) NOT NULL, 
            last_name VARCHAR(30) NOT NULL, 
            email email_type UNIQUE NOT NULL, 
            role role_type NOT NULL, 
            api_token VARCHAR(32) UNIQUE NOT NULL`
		);
		await createTable(
			db,
			'parking_spots',
			`id SERIAL PRIMARY KEY, 
            name VARCHAR(50) NOT NULL`
		);

		await createTable(
			db,
			'bookings',
			`id SERIAL PRIMARY KEY, 
            created_by INTEGER REFERENCES users, 
            start_datetime TIMESTAMPTZ NOT NULL, 
            end_datetime TIMESTAMPTZ NOT NULL, 
            parking_spot INTEGER REFERENCES parking_spots, 
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, 
            updated_at TIMESTAMPTZ,
            CONSTRAINT start_date_in_future CHECK (start_datetime > NOW()),
            CONSTRAINT end_date_after_start_date CHECK (end_datetime > start_datetime),
            CONSTRAINT bookings_overlap EXCLUDE USING gist
                (parking_spot WITH =,
                tstzrange(start_datetime, end_datetime, '()') WITH &&)`
		);

		await db.query(`
            CREATE OR REPLACE FUNCTION set_timestamp_on_update()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = now();
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

		await db.query(`
            DROP TRIGGER IF EXISTS set_timestamp_on_update_trigger
            ON bookings;
            
            CREATE TRIGGER set_timestamp_on_update_trigger
                BEFORE UPDATE
                ON bookings
                FOR EACH ROW
                EXECUTE PROCEDURE set_timestamp_on_update();
        `);		
        
        await db.query(`
            CREATE INDEX IF NOT EXISTS bookings_id_idx ON bookings (id);
            CREATE INDEX IF NOT EXISTS users_id_idx ON users (id);
            CREATE INDEX IF NOT EXISTS parking_spots_id_idx ON parking_spots (id);
        `);
	} catch (error) {
		console.error(error);
	}
}
