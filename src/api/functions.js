import fetch from 'node-fetch';

export function passThreadControl(db, req, res) {
	var ID = req.body.originalDetectIntentRequest.payload.data.sender.id;
	var body = {
	  "recipient":{"id":ID},
	  "target_app_id":2136468829966255,
	  "metadata":"String to pass to secondary receiver app" 
	}
	fetch('https://graph.facebook.com/v2.6/me/pass_thread_control?access_token=EAAOrRENjZBw0BAOKHjl9IWzWiGvkbfR8aiCByEnE7dmA2AannHCSOWZC0BofIYFZAjnPUA4klQEzZApAIe2EZCRHH6Xm4YSERa18NJtGLqlDd7vEfUETBWxCUk1ugB9wXJNjeg71D5hzAQ4UDCmqRvsRWWXUAyIYUN2hmKuAfZAwZDZD', {
		method: 'POST',
		body: JSON.stringify(body),
		headers: {'Content-Type':'application/json'}
	})
		.then(res => res.json())
		.then(json => console.log(json));
}

export function takeThreadControl(db, req, res) {
	var ID = req.body.originalDetectIntentRequest.payload.data.sender.id;
	var body = {
	  "recipient":{"id":ID},
	  "metadata":"String to pass to the secondary receiver" 
	}
	fetch('https://graph.facebook.com/v2.6/me/take_thread_control?access_token=EAAOrRENjZBw0BAOKHjl9IWzWiGvkbfR8aiCByEnE7dmA2AannHCSOWZC0BofIYFZAjnPUA4klQEzZApAIe2EZCRHH6Xm4YSERa18NJtGLqlDd7vEfUETBWxCUk1ugB9wXJNjeg71D5hzAQ4UDCmqRvsRWWXUAyIYUN2hmKuAfZAwZDZD', {
		method: 'POST',
		body: JSON.stringify(body),
		headers: {'Content-Type':'application/json'}
	})
		.then(res => res.json())
		.then(json => console.log(json));
}

export function addUser(db, req, res) {
	var checkUserText = 'SELECT user_id from user WHERE user_id = ?';
	var ID = req.body.originalDetectIntentRequest.payload.data.sender.id;
	db.query(checkUserText, ID, (err, rows) => {
		if (err) {
			console.log(err);
		}
		if (rows.length) {
			//console.log('User already exists');
		}
		else {
			var addUserText = 'INSERT INTO user(user_id) VALUES(?);';
			db.query(addUserText, ID, (err, rows) => {
				if (err) {
					console.log(err);
				}
			});
		}
	});
}

export function changeUsername(db, req, res) {
	var ID = req.body.originalDetectIntentRequest.payload.data.sender.id;
	var checkUserText = 'SELECT user_id from user WHERE user_id = ?';
	db.query(checkUserText, ID, (err, rows) => {
		if (err) {
			console.log(err);
		}
		if (!rows.length) {
			console.log('Change username error');
			return res.json({'fulfillmentText':'Apparently, you\'re not real.'});
		}
		var addNameText = 'UPDATE user SET username = ? WHERE user_id = ?';
		var newUsername = req.body.queryResult.parameters.username;
		var userParams = [ID, newUsername];
		db.query(addNameText, userParams, (err, rows) => {
			if (err) {
				console.log(err);
			}
			return res.json({'fulfillmentText':`Hi, ${newUsername}! What do you want to do now?`});
		});
	});
}

export function availableBooks (db, req, res) {
	const selection = 'SELECT title, author, category FROM book WHERE isBorrowed IS FALSE ORDER BY RAND() LIMIT 10;';
	db.query(selection, (err, rows) => {
		if (err) {
			console.log(err);
			return res.json({'fulfillmentText':'Available Books Error'});
		}
		if(!rows.length) {
			return res.json({'fulfillmentText':'Sorry, no available books right now.'});
		}
		var books = 'Here are some available books:\n';
		for (var i = 0; i < rows.length; i++) {
			var index = i + 1;
			books += '\n\n[' + index.toString() + '] ' + rows[i].title + '\nAuthor: ' + rows[i].author +
			'\nCategory: ' + rows[i].category;
		}
		return res.json({'fulfillmentText':books});
	});
}

export function borrowBook(db, req, res) {
	const borrowSearchParams = req.body.queryResult.parameters;
	var ID = req.body.originalDetectIntentRequest.payload.data.sender.id;
	var borrowText = 'SELECT title,author,category,image,isBorrowed FROM book WHERE title LIKE ?';
	var borrowTitle = '%' + borrowSearchParams.title + '%';
	db.query(borrowText, borrowTitle, (err, rows) => {
		if (err) {
			console.log(err);
			return res.json({'fulfillmentText':'Borrowing Error'});
		}
		if (!rows.length) {
			return res.json({'fulfillmentText':'Sorry, we don\'t seem to have that book.'});
		}
		if (rows[0].isBorrowed) {
			return res.json({'fulfillmentText':'That book is currently being borrowed by someone.'});
		}
		var updateText = 'UPDATE book SET isBorrowed = ?,user_id = ? WHERE title = ?';
		var completeTitle = rows[0].title;
		var completeAuthor = rows[0].author;
		var completeCategory = rows[0].category;
		var completeImage = rows[0].image;
		const bookParams = [1, ID, completeTitle];
		db.query(updateText, bookParams, (err, rows) => {
			if (err) {
				console.log(err);
				return res.json({'fulfillmentText':'Sorry, I didn\'t quite get that.'});
			}
			var searchText = 'SELECT title,author,category,image FROM book WHERE title = ?'
			db.query(searchText, borrowSearchParams.title, (err, rows) => {
				if (err) {
					console.log(err);
				}
				return res.json({'fulfillmentMessages':[
			      card(completeTitle, completeAuthor, completeImage, completeCategory),
			      quickReply(`You borrowed "${completeTitle}". Enjoy reading!`, 'Show more books', 'Available categories', '')
			    ]});
			});
		});
	});
}

export function returnBook(db, req, res) {
	const returnSearchParams = req.body.queryResult.parameters;
	var ID = req.body.originalDetectIntentRequest.payload.data.sender.id;
	var returnText = 'SELECT title,category,isBorrowed FROM book WHERE title LIKE ?';
	var returnTitle = '%' + returnSearchParams.title + '%';
	db.query(returnText, returnTitle, (err, rows) => {
		if (err) {
			console.log(err);
			return res.json({'fulfillmentText':'Returning Error'});
		}
		if (!rows.length) {
			return res.json({'fulfillmentText':'Sorry, we don\'t seem to have that book.'});
		}
		if (!rows[0].isBorrowed) {
			return res.json({'fulfillmentText':'That book is not currently borrowed.'});
		}
		var updateText = 'UPDATE book SET isBorrowed = ?,user_id = ? WHERE title = ?';
		var completeTitle = rows[0].title;
		var recommendedCateg = rows[0].category;
		var bookParams = [0, null, completeTitle];
		db.query(updateText, bookParams, (err, rows) => {
			if (err) {
				console.log(err);
				return res.json({'fulfillmentText':'Sorry, I didn\'t quite get that.'});
			}
			push(ID, `Did you like what you read? You can try 'search category ${recommendedCateg}' for similar books.`)
			return res.json({'fulfillmentText':`You returned "${completeTitle}"`});
		});
	});
}

export function searchThreeParams(db, req, res) {
	const search3Params = req.body.queryResult.parameters;
	var search3Text = 'SELECT * FROM book WHERE title LIKE ? AND author LIKE ? AND category LIKE ?';
	var bookParams = ['%' + search3Params.title + '%', '%' + search3Params.author + '%', '%' + search3Params.category + '%'];
	db.query(search3Text, bookParams, (err, rows) => {
		if (err) {
			console.log(err);
			return res.json({'fulfillmentText':'Searching Error'});
		}
		if (!rows.length) {
			return res.json({'fulfillmentText':'Sorry, we don\'t seem to have books like that.'});
		}
		var bookResults = `Search results for books about ${search3Params.category} titled ${search3Params.title} by ${search3Params.author}`;
		for (var i = 0; i < rows.length; i++) {
			var index = i + 1;
			bookResults += '\n\n[' + index.toString() + '] ' + rows[i].title + '\nAuthor: ' + rows[i].author + 
			'\nCategory: ' + rows[i].category;
		}
		return res.json({'fulfillmentText':bookResults});
	});
}

export function searchTwoParams(db, req, res) {
	const search2Params = req.body.queryResult.parameters;
	var search2Text = '';
	var bookParams = '';
	var bookResults = '';
	if (!search2Params.title == '' && !search2Params.author == '' && search2Params.category == '') {
		search2Text = 'SELECT * FROM book WHERE title LIKE ? AND author LIKE ?';
		bookParams = ['%' + search2Params.title + '%', '%' + search2Params.author + '%'];
		bookResults = `Search results for books titled ${search2Params.title} by ${search2Params.author}:`;
	}
	else if (!search2Params.title == '' && search2Params.author == '' && !search2Params.category == '') {
		search2Text = 'SELECT * FROM book WHERE title LIKE ? AND category LIKE ?';
		bookParams = ['%' + search2Params.title + '%', '%' + search2Params.category + '%'];
		bookResults = `Search results for books about ${search2Params.category} titled ${search2Params.title}:`;
	}
	else if (search2Params.title == '' && !search2Params.author == '' && !search2Params.category == '') {
		search2Text = 'SELECT * FROM book WHERE author LIKE ? AND category LIKE ?';
		bookParams = ['%' + search2Params.author + '%', '%' + search2Params.category + '%'];
		bookResults = `Search results for books about ${search2Params.category} by ${search2Params.author}:`;
	}
	db.query(search2Text, bookParams, (err, rows) => {
		if (err) {
			console.log(err);
			return res.json({'fulfillmentText':'Searching Error'});
		}
		if (!rows.length) {
			return res.json({'fulfillmentText':'Sorry, we don\'t seem to have books like that.'});
		}
		for (var i = 0; i < rows.length; i++) {
			var index = i + 1;
			bookResults += '\n\n[' + index.toString() + '] ' + rows[i].title + '\nAuthor: ' + rows[i].author + 
			'\nCategory: ' + rows[i].category;
		}
		return res.json({'fulfillmentText':bookResults});
	});
}

export function searchOneParams(db, req, res) {
	const search1Params = req.body.queryResult.parameters;
	var search1Text = '';
	var bookParams = '';
	var bookResults = '';
	if (!search1Params.title == '') {
		search1Text = 'SELECT * FROM book WHERE title LIKE ?';
		bookParams = '%' + search1Params.title + '%';
		bookResults = `Search results for books titled ${search1Params.title}:`;
	}
	else if (!search1Params.author == '') {
		search1Text = 'SELECT * FROM book WHERE author LIKE ?';
		bookParams = '%' + search1Params.author + '%';
		bookResults = `Search results for books by ${search1Params.author}:`;
	}
	else if (!search1Params.category == '') {
		search1Text = 'SELECT * FROM book WHERE category LIKE ?';
		bookParams = '%' + search1Params.category + '%';
		bookResults = `Search results for books about ${search1Params.category}:`;
	}
	db.query(search1Text, bookParams, (err, rows) => {
		if (err) {
			console.log(err);
			return res.json({'fulfillmentText':'Searching Error'});
		}
		if (!rows.length) {
			return res.json({'fulfillmentText':'Sorry, we don\'t seem to have books like that.'});
		}
		for (var i = 0; i < rows.length; i++) {
			var index = i + 1;
			bookResults += '\n\n[' + index.toString() + '] ' + rows[i].title + '\nAuthor: ' + rows[i].author + 
			'\nCategory: ' + rows[i].category;
		}
		return res.json({'fulfillmentText':bookResults});
	});
}

export function showCategories(db, req, res) {
	const categorySelection = 'SELECT DISTINCT category FROM book';
	db.query(categorySelection, (err, rows) => {
		if (err) {
			console.log(err);
			return res.json({'fulfillmentText':'Categories Error'});
		}
		if(!rows.length) {
			return res.json({'fulfillmentText':'Sorry, no categories available'});
		}
		var categories = 'Library Categories:';
		for (var i = 0; i < rows.length; i++) {
			var index = i + 1;
			categories += '\n\n[' + index.toString() + '] ' + rows[i].category;
		}
		return res.json({'fulfillmentText':categories});
	});
}

export function help(db, req, res) {
	var helpText = 'Here are some commands you can use:\n' + '\nsearch <title, author, category> ' + '<what you want to search for>\n' 
		+ 'borrow <book you want to borrow>\n' + 'return <book you want to return>\n' + '\nYou can also search with two or more parameters at once! Here are some ways you can do that:\n'
		+ '\nsearch books titled <title> by <author>\n' + 'search books about <category> titled <title>\n' + 'search books about <category> by <author>\n'
		+ '\nYou can also click on a quick reply below to get started!';
	return res.json({'fulfillmentMessages':[
		quickReply(helpText, 'Show random books', 'Available categories', 'Change username'),
	]});
}

export function push(ID, text) {
	var FBMessenger = require('fb-messenger')
	var messenger = new FBMessenger('EAAOrRENjZBw0BAOKHjl9IWzWiGvkbfR8aiCByEnE7dmA2AannHCSOWZC0BofIYFZAjnPUA4klQEzZApAIe2EZCRHH6Xm4YSERa18NJtGLqlDd7vEfUETBWxCUk1ugB9wXJNjeg71D5hzAQ4UDCmqRvsRWWXUAyIYUN2hmKuAfZAwZDZD')
	messenger.sendTextMessage(ID, text, function (err, body) {
		if (err) return console.error(err)
	})
}

export function card(title, author, image, category) {
	var showCard = {'card': {
		'title':title,
		'subtitle':author,
		'imageUri':image,
		'buttons': [
			{
				'text':`return ${title}`
			},
			{
				'text':`search category ${category}`
			}
		]
		},
		'platform':'FACEBOOK'
	}
	return showCard;
}

export function quickReply(title, text1, text2, text3) {
	var showQuickReply = {'quickReplies': {
		'title':title,
		'quickReplies': [
			text1,
			text2,
			text3
		]
	},
	'platform':'FACEBOOK'
	}
	return showQuickReply;
}