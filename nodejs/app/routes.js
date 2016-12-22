var mysql       = require('../util/database.js');
var xmlbuilder  = require('xmlbuilder');
var uuid        = require('node-uuid');
var fs          = require('fs');
var JSZip       = require("jszip");

const EXPORT_FOLDER = __dirname + '/../../fs/';


module.exports = function(app) {
  // ###########################################################################
  // PROJECTS API
  // ###########################################################################
  app.get('/api/projects', function($request, $response) {
    if($request.query.project_id)
    {
      var $_project_id = parseFloat($request.query.project_id)
      mysql.one("CALL R_FETCH_PROJECT_BY_ID(?);", [$_project_id], function($error, $result, $fields) {
        $response.json($result);
      });
    }
    else 
    {
      mysql.many("CALL R_FETCH_ALL_PROJECTS();", [], function($error, $result, $fields) {
        $response.json($result);
      });
    }
  });

  app.post('/api/projects', function($request, $response) {
    console.log($request.body);

    var $_name        = $request.body.name;
    var $_description = $request.body.description;

    mysql.one("CALL R_CREATE_PROJECT(?,?);", [$_name, $_description], function($error, $result, $fields) {
      if($error) {
        console.log($error);
      }

      mysql.many("CALL R_FETCH_ALL_PROJECTS();", [], function($error, $result, $fields) {
        $response.json($result);
      });

    });
  });

  app.get('/api/project/:project_id/keys', function($request, $response) {
    mysql.many("CALL R_FETCH_ALL_PROJECT_KEYS(?);", [parseFloat($request.params.project_id)], function($error, $result, $fields) {
      $response.json($result);
    });
  });

  app.get('/api/project/:project_id/translations', function($request, $response) {
    var project_id  = parseFloat($request.params.project_id);
    var language_id = parseFloat($request.query.language_id);
    var key_id      = parseFloat($request.query.key_id);

    if($request.query.language_id)
    {
      mysql.many("CALL R_FETCH_ALL_PROJECT_TRANSLATIONS_BY_LANGUAGE(?, ?);", [project_id, language_id], function($error, $result, $fields) {
        $response.json($result);
      });
    }
    else if($request.query.key_id)
    {
      mysql.many("CALL R_FETCH_ALL_PROJECT_TRANSLATIONS_BY_KEY(?, ?);", [project_id, key_id], function($error, $result, $fields) {
        $response.json($result);
      });
    }
  });

  app.get('/api/project/:project_id/matrix', function($request, $response) {
    var project_id  = parseFloat($request.params.project_id);

    var matrix = {};

    var $i = 0;


    console.log("Building matrix");

    mysql.many("CALL R_FETCH_ALL_PROJECT_KEYS(?);", [project_id], function($error, $result1, $fields) {
      $result1.forEach(function(key){
        var data = {};
        var $j = 0;

        mysql.many("CALL R_FETCH_ALL_PROJECT_TRANSLATIONS_BY_KEY(?, ?);", [project_id, key.id], function($error, $result2, $fields) {
          $i++;

          $result2.forEach(function(el) {
            $j++;

            data[el.language_id] = (el.value && el.value != '');

            matrix[key.id] = data;

            if($i >= $result1.length && $j >= $result2.length) {
              $response.json(matrix);
            }
          });
        });
      });
    });
  });

  app.post('/api/project/keys', function($request, $response) {
    var $_name        = $request.body.name;
    var $_project_id  = parseFloat($request.body.project_id);

    mysql.one("CALL R_CREATE_PROJECT_KEY(?,?);", [$_project_id, $_name], function($error, $result, $fields) {
      if($error) {
        console.log($error);
      }

      mysql.many("CALL R_FETCH_ALL_PROJECT_KEYS();", [$_project_id], function($error, $result, $fields) {
        $response.json($result);
      });

    });
  });

  app.post('/api/project/translations', function($request, $response) {
    var $_value        = $request.body.value;
    var $_project_id   = parseFloat($request.body.project_id);
    var $_language_id  = parseFloat($request.body.language_id);
    var $_key_id       = parseFloat($request.body.key_id);

    mysql.one("CALL R_CREATE_PROJECT_TRANSLATION(?,?,?,?);", [$_project_id, $_key_id, $_language_id, $_value], function($error, $result, $fields) {
      if($error) {
        console.log($error);
      }

      $response.json({"status": "OK"});
    });
  });

  // ###########################################################################
  // EXPORT
  // ###########################################################################
  app.get('/export/android/project/:project_id', function($request, $response) {
    var $project_id = parseFloat($request.params.project_id);

    var JSZip = require("jszip");
    var zip = new JSZip();
    var request_uuid = uuid.v4();

    mysql.many("CALL R_FETCH_ALL_LANGUAGES();", [], function($error, $languages, $fields)
    {
      $j = 0;

      $languages.forEach(function($language)
      {
        mysql.many("CALL R_FETCH_ALL_PROJECT_TRANSLATIONS_BY_LANGUAGE(?, ?);", [$project_id, $language.id], function($error, $result, $fields) {

          var builder = xmlbuilder.create('resources');
          var $i = 0;


          $result.forEach(function($item) 
          {
            //<string name="lbl_heading_about">About</string>
            builder.e('string', {name: $item.code}).r($item.value ? $item.value : $item.code);

            $i++;

            if($i >= $result.length) {
              var xml = builder.end({pretty: true});

              zip.folder('values-' + $language.iso_code.toLowerCase()).file('strings.xml', xml);

              $j++;

              if($j >= $languages.length) {
                var buffer = zip.generate({type:"nodebuffer"});

                fs.writeFile(EXPORT_FOLDER + request_uuid + ".zip", buffer, function(err) {
                  if (err) throw err;

                  fs.readFile(EXPORT_FOLDER + request_uuid + ".zip", 'binary', function(a_error, data) {
                    $response.setHeader('Content-Type', 'application/zip');
                    $response.setHeader('Content-Disposition', 'attachment; filename='+request_uuid+'.zip');

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

  app.get('/export/ios/project/:project_id', function($request, $response) {
    var $project_id = parseFloat($request.params.project_id);

    var JSZip = require("jszip");
    var zip = new JSZip();
    var request_uuid = uuid.v4();

    mysql.many("CALL R_FETCH_ALL_LANGUAGES();", [], function($error, $languages, $fields)
    {
      $j = 0;

      $languages.forEach(function($language)
      {
        mysql.many("CALL R_FETCH_ALL_PROJECT_TRANSLATIONS_BY_LANGUAGE(?, ?);", [$project_id, $language.id], function($error, $result, $fields) {

          var builder = xmlbuilder.create('resources');
          var $i = 0;

          var content = "";

          $result.forEach(function($item) 
          {
            //"label" = "value";
            var $value = $item.value ? $item.value :  $item.code;
            $value = $value.replace(/"/g, "\\\"");
            $value = $value.replace(/'/g, "\\\'");

            content += '"' + $item.code + '" = "' + $value + '";' + "\n";

            $i++;

            if($i >= $result.length) {
              zip.folder($language.iso_code.toLowerCase() + ".lproj").file('Localizable.strings', content);

              $j++;

              if($j >= $languages.length) {
                var buffer = zip.generate({type:"nodebuffer"});

                fs.writeFile(EXPORT_FOLDER + request_uuid + ".zip", buffer, function(err) {
                  if (err) throw err;

                  fs.readFile(EXPORT_FOLDER + request_uuid + ".zip", 'binary', function(a_error, data) {
                    $response.setHeader('Content-Type', 'application/zip');
                    $response.setHeader('Content-Disposition', 'attachment; filename='+request_uuid+'.zip');

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

  app.get('/export/xls/project/:project_id', function($request, $response) {
    var project_id = parseFloat($request.params.project_id);

    var xlsx = require('node-xlsx');
    var request_uuid = uuid.v4();
    var $xls_data = [];

    var $xls_sheet = {name: "Translations", data: []}


    mysql.many("CALL R_FETCH_ALL_PROJECT_KEYS(?);", [project_id], function($error, $projectKeys, $fields) {
      $xls_headers = ["Key"];

      mysql.many("CALL R_FETCH_ALL_LANGUAGES();", [], function($error, $languages, $fields)
      {
        $languages.forEach(function($language)
        {
          $xls_headers.push($language.iso_code)

          if($xls_headers.length > $languages.length)
          {
            $xls_sheet['data'].push($xls_headers);

            $projectKeys.forEach(function($key)
            {
              mysql.many("CALL R_FETCH_ALL_PROJECT_TRANSLATIONS_BY_KEY(?, ?);", [project_id, $key.id], function($error, $translations, $fields)
              {
                var $xls_row = [$key.code];

                $translations.forEach(function($translation) {
                  $xls_row.push($translation.value);

                  if($xls_row.length > $languages.length)
                  {
                    $xls_sheet['data'].push($xls_row);

                    if($xls_sheet['data'].length > $projectKeys.length)
                    {
                      $xls_data.push($xls_sheet);

                      $response.setHeader('Content-Type', 'application/vnd.ms-excel');
                      $response.setHeader('Content-Disposition', 'attachment; filename='+request_uuid+'.xlsx');

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
  app.get('/api/languages', function($request, $response) {

    mysql.many("CALL R_FETCH_ALL_LANGUAGES();", [], function($error, $result, $fields) {
      $response.json($result);
    });
  });


  // ###########################################################################
  // APPLICATION
  // ###########################################################################
  app.get('/', function($request, $response) {
    $response.json('./public/index.html');
  });
}
