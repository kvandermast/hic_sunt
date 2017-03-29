var mysql = require('../util/database.js');
var xmlbuilder = require('xmlbuilder');
var uuid = require('node-uuid');
var fs = require('fs');
var JSZip = require("jszip");
var Bluebird = require('bluebird');

const EXPORT_FOLDER = __dirname + '/../../fs/';


module.exports = function (app) {
    // ###########################################################################
    // PROJECTS API
    // ###########################################################################
    app.get('/api/projects', function ($request, $response) {
        if ($request.query.project_id) {
            var $_project_id = parseFloat($request.query.project_id);

            mysql.queryRow("CALL R_FETCH_PROJECT_BY_ID(?);", [$_project_id])
                .then(function ($result) {
                    $response.json($result);
                })
                .catch(function ($error) {
                    $response.json([])
                });
        }
        else {
            mysql.query("CALL R_FETCH_ALL_PROJECTS();", [])
                .then(function ($result) {
                    $response.json($result);
                })
                .catch(function (error) {
                    $response.json([]);
                });
        }
    });

    app.post('/api/projects', function ($request, $response) {
        var $_name = $request.body.name;
        var $_description = $request.body.description;


        mysql.query("CALL R_CREATE_PROJECT(?,?);", [$_name, $_description])
            .then(function () {
                mysql.query("CALL R_FETCH_ALL_PROJECTS();", [])
                    .then(function ($data) {
                        $response.json($data);
                    });
            });
    });

    app.put('/api/projects', function ($request, $response) {
        var $_id = $request.body.id;
        var $_name = $request.body.name;
        var $_description = $request.body.description;

        mysql.query("CALL R_UPDATE_PROJECT(?,?,?);", [$_id, $_name, $_description])
            .then(function ($data) {
                $response.json($data);
            })
            .catch(function ($error) {
                $response.json($error);
            });
    });

    app.delete('/api/projects', function ($request, $response) {
        var $_id = $request.query.id;

        mysql.query("CALL R_DELETE_PROJECT(?);", [$_id])
            .then(function ($data) {
                $response.json($data);
            })
            .catch(function ($error) {
                $response.json($error);
            });
    });

    app.get('/api/project/keys', function ($request, $response) {
        var project_id = parseFloat($request.query.project_id);
        var key_id = parseFloat($request.query.id);

        if (key_id) {
            mysql.queryRow("CALL R_FETCH_PROJECT_KEY_BY_ID(?);", [key_id])
                .then(function ($data) {
                    $response.json($data);
                })
        } else {
            mysql.query("CALL R_FETCH_ALL_PROJECT_KEYS(?);", [project_id])
                .then(function ($data) {
                    $response.json($data);
                });
        }
    });

    app.get('/api/project/:project_id/translations', function ($request, $response) {
        var project_id = parseFloat($request.params.project_id);
        var language_id = parseFloat($request.query.language_id);
        var key_id = parseFloat($request.query.key_id);

        if ($request.query.language_id) {
            mysql.query("CALL R_FETCH_ALL_PROJECT_TRANSLATIONS_BY_LANGUAGE(?, ?);", [project_id, language_id])
                .then(function ($result) {
                    $response.json($result);
                });
        }
        else if ($request.query.key_id) {
            mysql.query("CALL R_FETCH_ALL_PROJECT_TRANSLATIONS_BY_KEY(?, ?);", [project_id, key_id])
                .then(function ($result) {
                    $response.json($result);
                });
        }
    });

    /**
     * Create the translation matrix for the controller. It maps the keys with the languages for the provided project.
     * The values of the matrix will be true or false, depending on the fact if the translation is given.
     */
    app.get('/api/project/:project_id/matrix', function ($request, $response) {
        var project_id = parseFloat($request.params.project_id);

        var matrix = {};
        console.log("Building matrix");

        mysql.query("CALL R_FETCH_ALL_PROJECT_KEYS(?);", [project_id])
            .map(function ($key) {
                matrix[$key.id] = [];

                return mysql.query("CALL R_FETCH_ALL_PROJECT_TRANSLATIONS_BY_KEY(?, ?);", [project_id, $key.id])
                    .map(function ($translation) {
                        matrix[$key.id][$translation.language_id] = (null !== $translation.value && $translation.value !== '');
                    });
            })
            .then(function () {
                $response.json(matrix);
            });
    });

    app.post('/api/project/keys', function ($request, $response) {
        var $_name = $request.body.name;
        var $_project_id = parseFloat($request.query.project_id);

        mysql.queryRow("CALL R_CREATE_PROJECT_KEY(?,?);", [$_project_id, $_name])
            .then(function ($result) {
                mysql.query("CALL R_FETCH_ALL_PROJECT_KEYS();", [$_project_id])
                    .then(function ($result) {
                        $response.json($result);
                    });
            });
    });

    app.put('/api/project/keys', function ($request, $response) {
        var $_id = parseFloat($request.query.id);
        var $_project_id = parseFloat($request.query.project_id);
        var $_name = $request.body.code;
        var $_section_id = parseFloat($request.body.project_section_id);

        mysql.queryRow("CALL R_UPDATE_PROJECT_KEY(?,?,?,?);", [$_id, $_project_id, $_section_id, $_name])
            .then(function ($result) {
                $response.json($result);
            });
    });

    app.post('/api/project/translations', function ($request, $response) {
        var $_value = $request.body.value;
        var $_project_id = parseFloat($request.body.project_id);
        var $_language_id = parseFloat($request.body.language_id);
        var $_key_id = parseFloat($request.body.key_id);

        mysql.queryRow("CALL R_CREATE_PROJECT_TRANSLATION(?,?,?,?);", [$_project_id, $_key_id, $_language_id, $_value])
            .then(function ($result) {
                $response.json({"status": "OK"});
            });
    });

    // ###########################################################################
    // EXPORT
    // ###########################################################################
    app.get('/export/android/project/:project_id', function ($request, $response) {
        var $project_id = parseFloat($request.params.project_id);

        var JSZip = require("jszip");
        var zip = new JSZip();
        var request_uuid = uuid.v4();

        mysql.many("CALL R_FETCH_ALL_LANGUAGES();", [], function ($error, $languages, $fields) {
            $j = 0;

            $languages.forEach(function ($language) {
                mysql.many("CALL R_FETCH_ALL_PROJECT_TRANSLATIONS_BY_LANGUAGE(?, ?);", [$project_id, $language.id], function ($error, $result, $fields) {

                    var builder = xmlbuilder.create('resources');
                    var $i = 0;


                    $result.forEach(function ($item) {
                        //<string name="lbl_heading_about">About</string>
                        builder.e('string', {name: $item.code}).r($item.value ? $item.value : $item.code);

                        $i++;

                        if ($i >= $result.length) {
                            var xml = builder.end({pretty: true});

                            zip.folder('values-' + $language.iso_code.toLowerCase()).file('strings.xml', xml);

                            $j++;

                            if ($j >= $languages.length) {
                                var buffer = zip.generate({type: "nodebuffer"});

                                fs.writeFile(EXPORT_FOLDER + request_uuid + ".zip", buffer, function (err) {
                                    if (err) throw err;

                                    fs.readFile(EXPORT_FOLDER + request_uuid + ".zip", 'binary', function (a_error, data) {
                                        $response.setHeader('Content-Type', 'application/zip');
                                        $response.setHeader('Content-Disposition', 'attachment; filename=' + request_uuid + '.zip');

                                        $response.write(data, 'binary');

                                        $response.end();
                                    });
                                });
                            }
                        }
                    });
                });
            });
        });
    });

    app.get('/export/ios/project/:project_id', function ($request, $response) {
        var $project_id = parseFloat($request.params.project_id);

        var JSZip = require("jszip");
        var zip = new JSZip();
        var request_uuid = uuid.v4();

        mysql.many("CALL R_FETCH_ALL_LANGUAGES();", [], function ($error, $languages, $fields) {
            $j = 0;

            $languages.forEach(function ($language) {
                mysql.many("CALL R_FETCH_ALL_PROJECT_TRANSLATIONS_BY_LANGUAGE(?, ?);", [$project_id, $language.id], function ($error, $result, $fields) {

                    var $i = 0;

                    var content = "";

                    $result.forEach(function ($item) {
                        //"label" = "value";
                        var $value = $item.value ? $item.value : $item.code;
                        $value = $value.replace(/"/g, "\\\"");
                        $value = $value.replace(/'/g, "\\\'");

                        content += '"' + $item.code + '" = "' + $value + '";' + "\n";

                        $i++;

                        if ($i >= $result.length) {
                            zip.folder($language.iso_code.toLowerCase() + ".lproj").file('Localizable.strings', content);

                            $j++;

                            if ($j >= $languages.length) {
                                var buffer = zip.generate({type: "nodebuffer"});

                                fs.writeFile(EXPORT_FOLDER + request_uuid + ".zip", buffer, function (err) {
                                    if (err) throw err;

                                    fs.readFile(EXPORT_FOLDER + request_uuid + ".zip", 'binary', function (a_error, data) {
                                        $response.setHeader('Content-Type', 'application/zip');
                                        $response.setHeader('Content-Disposition', 'attachment; filename=' + request_uuid + '.zip');

                                        $response.write(data, 'binary');

                                        $response.end();
                                    });
                                });
                            }
                        }
                    });
                });
            });
        });
    });

    app.get('/export/xls/project/:project_id', function ($request, $response) {
        var project_id = parseFloat($request.params.project_id);

        var xlsx = require('node-xlsx');
        var request_uuid = uuid.v4();
        var $xls_data = [];

        var $xls_sheet = {name: "Translations", data: []}


        mysql.many("CALL R_FETCH_ALL_PROJECT_KEYS(?);", [project_id], function ($error, $projectKeys, $fields) {
            $xls_headers = ["Key"];

            mysql.many("CALL R_FETCH_ALL_LANGUAGES();", [], function ($error, $languages, $fields) {
                $languages.forEach(function ($language) {
                    $xls_headers.push($language.iso_code)

                    if ($xls_headers.length > $languages.length) {
                        $xls_sheet['data'].push($xls_headers);

                        $projectKeys.forEach(function ($key) {
                            mysql.many("CALL R_FETCH_ALL_PROJECT_TRANSLATIONS_BY_KEY(?, ?);", [project_id, $key.id], function ($error, $translations, $fields) {
                                var $xls_row = [$key.code];

                                $translations.forEach(function ($translation) {
                                    $xls_row.push($translation.value);

                                    if ($xls_row.length > $languages.length) {
                                        $xls_sheet['data'].push($xls_row);

                                        if ($xls_sheet['data'].length > $projectKeys.length) {
                                            $xls_data.push($xls_sheet);

                                            $response.setHeader('Content-Type', 'application/vnd.ms-excel');
                                            $response.setHeader('Content-Disposition', 'attachment; filename=' + request_uuid + '.xlsx');

                                            $response.write(xlsx.build($xls_data), 'binary');

                                            $response.end();
                                        }
                                    }
                                });
                            });
                        });
                    }
                });
            });
        });
    });


    // ###########################################################################
    // LANGUAGES API
    // ###########################################################################
    app.get('/api/languages', function ($request, $response) {

        mysql.many("CALL R_FETCH_ALL_LANGUAGES();", [], function ($error, $result, $fields) {
            $response.json($result);
        });
    });


    // ###########################################################################
    // IMPORT DATA
    // ###########################################################################

    app.post('/api/import/', function ($request, $response) {
        var $_project_id = parseFloat($request.body.project_id);
        var $_language_id = parseFloat($request.body.language_id);

        var type = $request.body.type;

        if (type.toUpperCase() === 'ANDROID') {
            var $_xml = $request.body.xml;

            var parseString = require('xml2js').parseString;
            parseString($_xml, function (err, result) {
                if (!err) {
                    result.resources.string.forEach(function (e) {
                        var $key = e.$.name;
                        var $val = e._;

                        mysql.insert("CALL R_IMPORT_TRANSLATION(?,?,?,?);", [$_project_id, $_language_id, $key, $val], function ($error, $result, $fields) {
                            //ignore.
                        });
                    });
                } else {
                    console.error(err);
                }
            });

            $response.json({'status': 'PROCESSING'});
        }
    });

    // ###########################################################################
    // PROJECT SECTIONS
    // ###########################################################################
    app.get('/api/project/sections', function ($request, $response) {
        var $_project_id = parseFloat($request.query.project_id);

        mysql.query("CALL R_FETCH_ALL_PROJECT_SECTIONS(?);", [$_project_id])
            .then(function ($result) {
                $response.json($result);
            });
    });

    app.post('/api/project/sections', function ($request, $response) {
        var $_project_id = parseFloat($request.body.project_id);
        var $_name = $request.body.name;

        mysql.query("CALL R_CREATE_PROJECT_SECTION(?,?);", [$_project_id, $_name])
            .then(function ($result) {
                $response.json($result);
            });
    });

    app.put('/api/project/sections', function ($request, $response) {
        var $_project_id = parseFloat($request.body.project_id);
        var $_id = parseFloat($request.body.id);
        var $_name = $request.body.name;

        mysql.query("CALL R_UPDATE_PROJECT_SECTION(?,?,?);", [$_id, $_project_id, $_name])
            .then(function ($result) {
                $response.json($result);
            });
    });

    app.delete('/api/project/sections', function ($request, $response) {
        var $_project_id = parseFloat($request.query.project_id);
        var $_id = parseFloat($request.query.id);

        mysql.queryRow("CALL R_DELETE_PROJECT_SECTION(?,?);", [$_id, $_project_id])
            .then(function ($result) {
                $response.json($result);
            })
            .catch(function ($error) {
                $response.json($error);
            });

    });

    // ###########################################################################
    // APPLICATION
    // ###########################################################################
    app.get('/', function ($request, $response) {
        $response.json('./public/index.html');
    });
}
