var mysql = require('../util/database.js');
var xmlbuilder = require('xmlbuilder');
var uuid = require('node-uuid');
var fs = require('fs');
var Bluebird = require('bluebird');
var path = require('path');

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
        var section_id = parseFloat($request.query.project_section_id);

        if (key_id) {
            mysql.queryRow("CALL R_FETCH_PROJECT_KEY_BY_ID(?);", [key_id])
                .then(function ($data) {
                    $response.json($data);
                })
        } else {
            if (section_id && section_id > 0) {
                mysql.query("CALL R_FETCH_PROJECT_KEY_BY_PROJECT_SECTION(?,?);", [project_id, section_id])
                    .then(function ($data) {
                        $response.json($data);
                    });
            } else {
                mysql.query("CALL R_FETCH_PROJECT_KEY_BY_PROJECT_SECTION(?,?);", [project_id, null])
                    .then(function ($data) {
                        $response.json($data);
                    });
            }
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
    app.get('/api/project/matrix', function ($request, $response) {
        var project_id = parseFloat($request.query.project_id);
        var section_id = parseFloat($request.query.project_section_id);

        var matrix = {};
        console.log("Building matrix");

        var sql = "CALL R_FETCH_PROJECT_KEY_BY_PROJECT_SECTION(?,?);";
        var sql_args = [project_id, null];

        if (section_id) {
            sql_args = [project_id, section_id];
        }

        mysql.query(sql, sql_args)
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
        var Excel = require('exceljs');
        var JSZip = require("jszip");
        var zip = new JSZip();
        var filesystem = Bluebird.promisifyAll(require("fs"));

        var $_project_id = parseFloat($request.params.project_id);
        var request_uuid = uuid.v4();

        fs.mkdirSync(EXPORT_FOLDER + request_uuid);

        mysql.queryRow("CALL R_FETCH_PROJECT_BY_ID(?); ", [$_project_id])
            .then(function ($project) {
                return mysql.query("CALL R_FETCH_ALL_LANGUAGES();", [])
                    .each(function ($language) {
                        var workbook = new Excel.Workbook();

                        workbook.creator = 'Hic sunt ';
                        workbook.created = new Date();  // new Date(1985, 8, 30);
                        workbook.modified = new Date();

                        return mysql.query("CALL R_FETCH_ALL_PROJECT_SECTIONS(?);", [$_project_id])
                            .each(function ($section) {
                                var worksheet = workbook.addWorksheet($section.name);

                                worksheet.columns = [
                                    {
                                        header: 'Code',
                                        key: 'code',
                                        width: 30,
                                        style: {
                                            font: {
                                                name: 'Arial',
                                                color: {argb: 'FF3F3FBF'},
                                                bold: true
                                            }
                                        }
                                    },
                                    {
                                        header: 'Original',
                                        key: 'original',
                                        width: 40,
                                        outlineLevel: 1,
                                        style: {
                                            font: {
                                                name: 'Arial',
                                                color: {argb: 'FF3F3FBF'}
                                            }
                                        },
                                        wrapText: true
                                    },
                                    {
                                        header: 'Translation',
                                        key: 'translation',
                                        width: 40,
                                        wrapText: true,
                                        font: {
                                            name: 'Arial',
                                        }
                                    }
                                ];

                                worksheet.getRow(1).font = {
                                    name: 'Arial',
                                    family: 4,
                                    size: 16,
                                    underline: 'double',
                                    bold: true
                                };

                                return mysql.query("CALL R_FETCH_PROJECT_TRANSLATIONS_FOR_EXPORT(?,?,?); ", [$_project_id, $language.id, $section.id])
                                    .each(function ($data) {
                                        worksheet.addRow({
                                            code: $data.code,
                                            original: $data.original,
                                            translation: $data.value
                                        });
                                    });
                            })
                            .then(function () {
                                // $response.write(workbook.xlsx, 'binary');
                                var $xls_fname = $project.name + '-' + $language.iso_code + ".xlsx";
                                var $xls_name = EXPORT_FOLDER + request_uuid + "/" + $xls_fname;

                                return workbook.xlsx.writeFile($xls_name)
                                    .then(function () {
                                    });
                            });
                    })
                    .then(function () {
                        var archiver = require('archiver');

                        var zipfile = path.join(EXPORT_FOLDER, request_uuid, $project.name + '.zip');
                        var output = fs.createWriteStream(zipfile);

                        // if the file is closed (finalized) sent hte contents to the output stream
                        output.on('close', function () {
                            filesystem.readFileAsync(zipfile, 'binary')
                                .then(function ($content) {
                                    $response.setHeader('Content-Type', 'application/zip');
                                    $response.setHeader('Content-Disposition', 'attachment; filename=' + $project.name + '.zip');

                                    $response.write($content, 'binary');

                                    $response.end();

                                    //TODO: remove contents of export folder
                                    /*filesystem.rmdirAsync(path.join(EXPORT_FOLDER, request_uuid))
                                     .then(function () {
                                     console.log("Completed rmdir ", EXPORT_FOLDER + '/' + request_uuid);
                                     })*/
                                });
                        });

                        var zipArchive = archiver('zip', {
                            zlib: {level: 9}
                        });

                        zipArchive.pipe(output);
                        zipArchive.glob(EXPORT_FOLDER + request_uuid + "/*.xlsx");
                        zipArchive.finalize();
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

        // IMPORT ANDROID RESOURCE FILE
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
        } else if (type.toUpperCase() === 'XLS') {
            var Excel = require('exceljs');
            var filesystem = Bluebird.promisifyAll(require("fs"));
            var request_uuid = uuid.v4();

            var $_xls_buffer = new Buffer($request.body.xls, 'base64');

            var $_xls_file = path.join(EXPORT_FOLDER, request_uuid + '.xlsx');

            filesystem.writeFileAsync($_xls_file, $_xls_buffer)
                .then(function () {
                    console.log("Saved file ", $_xls_file);

                    // read from a file
                    var workbook = new Excel.Workbook();
                    const CODE = 1;
                    const TRANSLATION = 3;

                    return workbook.xlsx.readFile($_xls_file)
                        .then(function () {
                            // use workbook
                            workbook.eachSheet(function (worksheet, sheetId) {
                                var row = 1;

                                while (row++ < worksheet.rowCount) {
                                    var $_row = worksheet.getRow(row);
                                    var code = $_row.getCell(CODE).value;
                                    var translation = $_row.getCell(TRANSLATION).value;

                                    mysql.queryRow("CALL R_IMPORT_TRANSLATION(?,?,?,?);", [ $_project_id, $_language_id, code, translation ])
                                        .then(function($data) {})
                                        .catch(function($error) { console.log($error)});
                                }
                            });

                            $response.end();

                        });

                    //TODO: remove file once import is completed
                })
                .catch(function (err) {
                    console.log(err);
                });
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
};