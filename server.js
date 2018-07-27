var fs      = require('fs');
var mysql = require('mysql');

var host = '';
var user = '';
var password = '';
var database = '';
var db_prefix = '';

var connection = mysql.createConnection({
  host     : host,
  user     : user,
  password : password,
  database : database
});

connection.connect(function(err){
if(!err) {
    console.log("Database is connected ...");    
} else {
    console.log("DATABASE IS DOWN!");
}
});

function if_table_exists(table_name, callback) {
    connection.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '"+database+"'  AND table_name = '"+table_name+"';", function (error, results, fields) {
        if (error) throw error;
        return callback(results[0]["COUNT(*)"]);
    });
}

function update_table_values(old_url, new_url, id, table_name, column, query_filters='') {
    if (id != '1' && table_name != '_blogs') {
        table_name = '_'+id+table_name; 
    }

    // Check if table exists
    if_table_exists(db_prefix+table_name, function(result){
        if (result == 1) {
            connection.query("UPDATE "+db_prefix+table_name+" SET "+column+" = replace("+column+", '"+old_url+"', '"+new_url+"') "+query_filters+";", function (error, results, fields) {
                if (error) throw error;
                console.log(db_prefix+table_name+':'+column);
                console.log(results.message+'\n');
            });
        }
    });
}

function process_tables(data, old_url, new_url, old_http, new_http, id) {
   for(var tbbKey in data) {

        var table_name = data[tbbKey].table;
        var column = data[tbbKey].column;
        var query_filters = data[tbbKey].query_filters;

        if (table_name == '_site' || table_name == '_blogs') {
            update_table_values(old_url, new_url, id, table_name, column, query_filters);
        } else {
            update_table_values(old_http+old_url, new_http+new_url, id, table_name, column, query_filters);
        }
    }
}

function roll_tide(){
    
    var raw_data = fs.readFileSync('data-octopus.json');
    var data = JSON.parse(raw_data);

    for(var urlKey in data.urls) {

        var old_url = data.urls[urlKey].old_url;
        var new_url = data.urls[urlKey].new_url;
        var old_http = data.urls[urlKey].old_http;
        var new_http = data.urls[urlKey].new_http;
        var id = data.urls[urlKey].id;

        console.log('\nMigrating URLs\nFROM: '+old_url+'\nTO: '+new_url+'\n');
        
        // UPDATE SINGLE TABLES
        if (id == 1) {
            process_tables(data.tables_single, old_url, new_url, old_http, new_http, id);
        }

        // UPDATE BROAD TABLES
        process_tables(data.tables_broad, old_url, new_url, old_http, new_http, id);

    }

}

roll_tide();
