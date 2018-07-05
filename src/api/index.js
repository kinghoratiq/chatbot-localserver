import { version } from '../../package.json';
import { Router } from 'express';
import facets from './facets';
import * as f from './functions';

export default ({ config, db }) => {
	let api = Router();

	// mount the facets resource
	api.use('/facets', facets({ config, db }));

	api.post('/EasterEggs', (req, res) => {
		if (req.body.queryResult.action == 'switch.receiver') {
			f.takeThreadControl(db, req, res);
		}
	});

	api.post('/LibraryChatbot', (req, res) => {
		let ifTitle = req.body.queryResult.parameters.title
		let ifAuthor = req.body.queryResult.parameters.author
		let ifCategory = req.body.queryResult.parameters.category
		try {
			f.addUser(db, req, res);
			switch (req.body.queryResult.action) {
				case 'searchParams':
					if (!ifTitle == '' && !ifAuthor == '' && !ifCategory == '') {
						return f.searchThreeParams(db, req, res);
					}
					else if (!ifTitle == '' && !ifAuthor == '' && ifCategory == '') {
						return f.searchTwoParams(db, req, res);
					}
					else if (!ifTitle == '' && ifAuthor == '' && !ifCategory == '') {
						return f.searchTwoParams(db, req, res);
					}
					else if (ifTitle == '' && !ifAuthor == '' && !ifCategory == '') {
						return f.searchTwoParams(db, req, res);
					}
					else if (!ifTitle == '' && ifAuthor == '' && ifCategory == '') {
						return f.searchOneParams(db, req, res);
					}
					else if (ifTitle == '' && !ifAuthor == '' && ifCategory == '') {
						return f.searchOneParams(db, req, res);
					}
					else if (ifTitle == '' && ifAuthor == '' && !ifCategory == '') {
						return f.searchOneParams(db, req, res);
					}
					else {
						return res.json({'fulfillmentText':'Input Error'});
					}
					break;
				case 'borrowParams':
					return f.borrowBook(db, req, res);
					break;
				case 'returnParams':
					return f.returnBook(db, req, res);
					break;
				case 'showBooks':
					return f.availableBooks(db, req, res);
					break;
				case 'categoryParams':
					return f.showCategories(db, req, res);
					break;
				case 'switch.receiver':
					f.passThreadControl(db, req, res);
					break;
				case 'help.text':
					return f.help(db, req, res);
					break;
				case 'change.username':
					return f.changeUsername(db, req, res);
					break;
			}
		} catch (err) {
			console.log(err);
			return res.json({'fulfillmentText':'Try Catch Error'});
		}
	});

	// perhaps expose some API metadata at the root
	api.get('/', (req, res) => {
		res.json({ version });
	});

	return api;
}