import Pool from 'pg-pool';

export let db: Pool = {};

export async function initDBClient() {
	
	db = await new Pool({
		database: process.env.DB_NAME,
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
	});

    return db;
}
