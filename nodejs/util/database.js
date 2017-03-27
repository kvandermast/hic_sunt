// require modules
var mysql = require('mysql');
var settings = require('../settings/settings.js');
var Promise = require('bluebird');


// connect to mysql
var pool = mysql.createPool(settings.mysql);



pool.getConnection(function ($err, $connection) {
    // connected! (unless `err` is set)

    if ($connection) {
        $connection.release();
    }

    if ($err) {
        console.log("==========================================================================================");
        console.log(" ERROR")
        console.log("==========================================================================================");
        console.log("Unable to connect to MySQL instance, please check if the MySQL is running and reachable.");
        console.log($err);
        console.log("==========================================================================================");

        throw new Error($err);
    }
});


var one = function ($sql, $params, $callback) {
    console.log("Executing <" + $sql + "> with parameters: " + JSON.stringify($params));

    pool.getConnection(function (err, connection) {
        connection.query($sql, $params, function ($error, $rows, $fields) {
            $result = $rows;

            if ($error) {
                console.log($error);
            }

            if ($result && $result.length > 0) {
                $result = $result.slice(0, $result.length - 1);
            }


            if ($rows && $rows.length >= 1) {
                $result = $rows.shift(); //take the first element
                $result = $result[0];
            }

            connection.release();

            $callback($error, $result, $fields);
        });
    });
};

var many = function ($sql, $params, $callback) {
    console.log("Executing <" + $sql + "> with parameters: " + JSON.stringify($params));

    pool.getConnection(function (err, connection) {
        connection.query($sql, $params, function ($error, $rows, $fields) {
            $result = $rows;

            if ($result) {
                if ($result.length > 0) {
                    $result = $result[0]; // $result.slice(0, $result.length - 1);
                }
            } else {
                $result = [];

            }

            connection.release();

            $callback($error, $result, $fields);
        });
    });
};

var query = function($sql, $params) {
    return new Promise(function(resolve, reject) {
        console.log("Querying <" + $sql + "> with parameters: " + JSON.stringify($params));

        pool.getConnection(function (err, connection) {
            if(err) {
                reject(err);
            } else {
                connection.query($sql, $params, function ($error, $rows, $fields) {
                    if($error) {
                        console.log($error);

                        reject($error);
                    } else {
                        var $result = $rows;

                        if ($result && $result.length > 0) {
                            $result = $result[0]; // $result.slice(0, $result.length - 1);
                        } else {
                            $result = [];
                        }

                        resolve($result);
                    }

                    connection.release();
                });
            }
        });
    });
};

var queryRow = function($sql, $params) {
    return new Promise(function(resolve, reject) {
        console.log("Querying <" + $sql + "> with parameters: " + JSON.stringify($params));

        pool.getConnection(function (err, connection) {
            if(err) {
                reject(err);
            } else {
                connection.query($sql, $params, function ($error, $rows, $fields) {
                    if($error) {
                        console.log($error);

                        reject($error);
                    } else {
                        var $result = $rows;

                        if ($result && $result.length > 0) {
                            $result = $result.slice(0, $result.length - 1);
                        }


                        if ($rows && $rows.length >= 1) {
                            $result = $rows.shift(); //take the first element
                            $result = $result[0];
                        }

                        resolve($result);
                    }

                    connection.release();
                });
            }
        });
    });
};

var insert = function ($sql, $params, $callback) {
    one($sql, $params, $callback);
};

var remove = function ($sql, $params, $callback) {
    one($sql, $params, $callback);
};

var update = function ($sql, $params, $callback) {
    many($sql, $params, $callback);
};


exports.one = one;
exports.many = many;
exports.insert = insert;
exports.update = update;
exports.remove = remove;
exports.query = query;
exports.queryRow = queryRow;
