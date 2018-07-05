import mysql from 'mysql'

export default callback => {

	const db = mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password: 'root',
		database: 'library',
		multipleStatements: true
	});

	db.connect(err => {
		if (err) {
			console.log('Cannot connect to database');
		}
		else {
			console.log('Connected to database');
		}
	});

	db.query('USE library')
	// connect to a database if needed, then pass it to `callback`:
	callback(db);
}