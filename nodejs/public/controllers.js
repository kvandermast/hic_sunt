var hicControllers = angular.module('hicControllers', []);


hicControllers.controller('projectsController', ['$scope', 'Project', '$http',
  function($scope, Project, $http) {
    $scope.formatData = {};

    $scope.projects = Project.query();
    $scope.sortOrder = 'name';


    $scope.createProject = function() {
      var name = $scope.projectName;
      var desc = $scope.projectDescription;

      var project = new Project();
      project.name = name;
      project.description = desc;

      project.$save();

      $scope.projects = Project.query();
    };
  }
]);

hicControllers.controller('translationsController', ['$scope', 'Project', 'ProjectKey', 'ProjectTranslationsMatrix', 'Language', '$routeParams', '$http',
  function($scope, Project, ProjectKey, ProjectTranslationsMatrix, Language, $routeParams, $http) {
    var project_id = $routeParams.project_id;

    $scope.project    = Project.get({"project_id": project_id});
    $scope.languages  = Language.query();
    $scope.keys       = ProjectKey.query({"project_id": project_id});
    $scope.matrix     = ProjectTranslationsMatrix.get({"project_id": project_id});


    $scope.createKey = function() {
      var name = $scope.keyName;

      var data = new ProjectKey();
      data.project_id = project_id;
      data.name       = name;

      data.$save();

      $scope.keys       = ProjectKey.query({"project_id": project_id});
      $scope.keyName    = '';
    };
  }
]);

hicControllers.controller('translationByLangController', ['$scope', 'Project', 'ProjectKey', 'ProjectTranslations', '$routeParams', '$http',
  function($scope, Project, ProjectKey, ProjectTranslations, $routeParams, $http) {
    var project_id = $routeParams.project_id;
    var language_id = $routeParams.language_id;

    $scope.project            = Project.get({"project_id": project_id});
    $scope.translations       = ProjectTranslations.query({"project_id": project_id, "language_id": language_id});

    $scope.updateProjectTranslations = function() {
      var translations = $scope.translations;

      translations.forEach(function(element, index) {
        var pt = new ProjectTranslations();
        pt.project_id   = $routeParams.project_id;
        pt.language_id  = $routeParams.language_id;
        pt.key_id       = element.project_key_id;
        pt.value        = element.value;

        pt.$save();


      });

      $scope.translations = ProjectTranslations.query({"project_id": project_id, "language_id": language_id});
    }

    $scope.createKey = function() {
      var name = $scope.keyName;

      var data = new ProjectKey();
      data.project_id = project_id;
      data.name       = name;

      data.$save();

      $scope.translations       = ProjectTranslations.query({"project_id": project_id, "language_id": language_id});
      $scope.keyName    = '';
    };
  }
]);

hicControllers.controller('translationByKeyController', ['$scope', 'Project', 'ProjectKey', 'ProjectTranslations', '$routeParams', '$http',
  function($scope, Project, ProjectKey, ProjectTranslations, $routeParams, $http) {
    var project_id = $routeParams.project_id;
    var key_id     = $routeParams.key_id;

    $scope.project            = Project.get({"project_id": project_id});
    $scope.translations       = ProjectTranslations.query({"project_id": project_id, "key_id": key_id});

    $scope.updateProjectTranslations = function() {
      var translations = $scope.translations;

      translations.forEach(function(element, index) {
        var pt = new ProjectTranslations();

        pt.project_id   = $routeParams.project_id;
        pt.key_id       = $routeParams.key_id;
        pt.language_id  = element.language_id;
        pt.value        = element.value;

        pt.$save();


      });

      $scope.translations = ProjectTranslations.query({"project_id": project_id, "language_id": language_id});
    }
  }
]);

hicControllers.controller('exportController', ['$scope', '$routeParams', '$http',
  function($scope, $routeParams, $http) {
    var project_id = $routeParams.project_id;
    var type       = $routeParams.type;

    $http({
      url: '/api/export/'+type+'/project/'+project_id,
      method: 'GET',
      params: {},
      responseType: 'arraybuffer'
    }).success(function(data, status, headers, config) {
      console.log(data);
      var file = new Blob([data], { type: 'application/zip'});

      var fileUrl = URL.createObjectURL(file);

      var a = document.createElement('a');
      a.href      = fileUrl;
      a.target    = '_blank';
      a.download  = 'zip.zip';

      document.body.appendChild(a);

      a.click();
    }).error(function(data, status, headers, config) {

    });
  }
]);
