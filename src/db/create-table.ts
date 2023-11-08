async function createTable(db, tableName, columnDefinitions) {
	try {
		const createTableQuery = `
			CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefinitions});				
		`;      
		await db.query(createTableQuery);
	} catch (error) {
		console.error(`Error creating table ${tableName}: ${error}`);
	}   
}

export default createTable;
