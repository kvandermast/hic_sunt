// ================================================
// README
// ================================================
//
// The settings.js has been added to the .gitignore configuration.
// Create a copy from settings.default.js and configure according to your
// environment
//
// Thanks for reading this.

var mysql = {
  user : "hic",
  password : "dracones",
  database : "hic",
  port : 3306,
  connectionLimit: 25,
// debug: true
}

var fs = {
  tmp : "/tmp/"
}


exports.mysql = mysql;
exports.fs = fs;
