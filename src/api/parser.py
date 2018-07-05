import csv

inserts = open('inserts.sql', 'w', encoding='Latin-1')
file = open('data.csv', 'r', encoding='Latin-1')
readCSV = csv.reader(file)

inserts.write('use library;\n')
for row in readCSV:
	inserts.write('insert into book(title,author,category,image) values (' + '"' + row[3].replace('"', '\\"') + '","' + row[4].replace('"', '\\"') + '","' + 
		row[6].replace('"', '\\"') + '","' + row[2].replace('"', '\\"') + '");\n')