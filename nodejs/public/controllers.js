var hicControllers = angular.module('hicControllers', []);


hicControllers.controller('projectsController', ['$scope', 'Project', '$http',
    function ($scope, Project, $http) {
        $scope.formatData = {};

        $scope.projects = Project.query();
        $scope.sortOrder = 'name';


        $scope.createProject = function () {
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
    function ($scope, Project, ProjectKey, ProjectTranslationsMatrix, Language, $routeParams, $http) {
        var project_id = $routeParams.project_id;

        $scope.project = Project.get({"project_id": project_id});
        $scope.languages = Language.query();
        $scope.keys = ProjectKey.query({"project_id": project_id});
        $scope.matrix = ProjectTranslationsMatrix.get({"project_id": project_id});


        $scope.createKey = function () {
            var name = $scope.keyName;

            var data = new ProjectKey();
            data.project_id = project_id;
            data.name = name;

            data.$save();

            $scope.keys = ProjectKey.query({"project_id": project_id});
            $scope.keyName = '';
        };
    }
]);

hicControllers.controller('translationByLangController', ['$scope', 'Project', 'ProjectKey', 'ProjectTranslations', '$routeParams', '$http',
    function ($scope, Project, ProjectKey, ProjectTranslations, $routeParams, $http) {
        var project_id = $routeParams.project_id;
        var language_id = $routeParams.language_id;

        $scope.project = Project.get({"project_id": project_id});
        $scope.translations = ProjectTranslations.query({"project_id": project_id, "language_id": language_id});

        $scope.updateProjectTranslations = function () {
            var translations = $scope.translations;

            translations.forEach(function (element, index) {
                var pt = new ProjectTranslations();
                pt.project_id = $routeParams.project_id;
                pt.language_id = $routeParams.language_id;
                pt.key_id = element.project_key_id;
                pt.value = element.value;

                pt.$save();


            });

            $scope.translations = ProjectTranslations.query({"project_id": project_id, "language_id": language_id});
        }

        $scope.createKey = function () {
            var name = $scope.keyName;

            var data = new ProjectKey();
            data.project_id = project_id;
            data.name = name;

            data.$save();

            $scope.translations = ProjectTranslations.query({"project_id": project_id, "language_id": language_id});
            $scope.keyName = '';
        };
    }
]);

hicControllers.controller('translationByKeyController', ['$scope', 'Project', 'ProjectKey', 'ProjectTranslations', '$routeParams', '$http',
    function ($scope, Project, ProjectKey, ProjectTranslations, $routeParams, $http) {
        var project_id = $routeParams.project_id;
        var key_id = $routeParams.key_id;

        $scope.project = Project.get({"project_id": project_id});
        $scope.translations = ProjectTranslations.query({"project_id": project_id, "key_id": key_id});

        $scope.updateProjectTranslations = function () {
            var translations = $scope.translations;

            translations.forEach(function (element, index) {
                var pt = new ProjectTranslations();

                pt.project_id = $routeParams.project_id;
                pt.key_id = $routeParams.key_id;
                pt.language_id = element.language_id;
                pt.value = element.value;

                pt.$save();


            });

            $scope.translations = ProjectTranslations.query({"project_id": project_id, "language_id": language_id});
        }
    }
]);

hicControllers.controller('exportController', ['$scope', '$routeParams', '$http',
    function ($scope, $routeParams, $http) {
        var project_id = $routeParams.project_id;
        var type = $routeParams.type;

        $http({
            url: '/api/export/' + type + '/project/' + project_id,
            method: 'GET',
            params: {},
            responseType: 'arraybuffer'
        }).success(function (data, status, headers, config) {
            console.log(data);
            var file = new Blob([data], {type: 'application/zip'});

            var fileUrl = URL.createObjectURL(file);

            var a = document.createElement('a');
            a.href = fileUrl;
            a.target = '_blank';
            a.download = 'zip.zip';

            document.body.appendChild(a);

            a.click();
        }).error(function (data, status, headers, config) {

        });
    }
]);

hicControllers.controller('importController', ['$scope', 'Language', 'Project', 'Import', '$routeParams', '$http',
    function ($scope, Language, Project, Import, $routeParams, $http) {
        var project_id = $routeParams.project_id;
        var type = $routeParams.type;

        $scope.project = Project.get({"project_id": project_id});
        $scope.import_type = type;
        $scope.languages = Language.query();

        $scope.upload = function () {
            var files = document.getElementsByName('file');

            for ($i = 0; $i < files.length; $i++) {
                var $file = files[$i];

                if($file.files.length === 1) {
                    var $languageId = $file.dataset.language;
                    var $projectId = $file.dataset.project;

                    var r = new FileReader();

                    r.onloadend = function(e) {
                        var result = e.target.result;

                        var data = new Import();
                        data.project_id = $projectId;
                        data.language_id = $languageId;
                        data.type = $scope.import_type;

                        if($scope.import_type.toUpperCase() === 'ANDROID') {
                            data.type = 'ANDROID';
                            data.xml = result;
                            data.$save();
                        }
                    };

                    r.readAsBinaryString($file.files[0]);
                }
            }
        };
    }
]);

hicControllers.controller('manageProjectSectionsController', ['$scope', 'Project', 'ProjectSection', '$routeParams', '$http',
    function ($scope, Project, ProjectSection, $routeParams, $http) {
        var project_id = $routeParams.project_id;

        $scope.project = Project.get({"project_id": project_id});
        $scope.sections = ProjectSection.query({"project_id": project_id});

        //$scope.languages = Language.query();
        //$scope.keys = ProjectKey.query({"project_id": project_id});
        //$scope.matrix = ProjectTranslationsMatrix.get({"project_id": project_id});


        $scope.createSection = function () {
            var name = $scope.name;

            var data = new ProjectSection();
            data.project_id = project_id;
            data.name = name;

            data.$save();

            $scope.sections = ProjectSection.query({"project_id": project_id});
            $scope.name = '';
        };

        $scope.updateSection = function($section) {

            //data.id = $sectionId;
            $section.project_id = $routeParams.project_id;
            //data.name = $value;

            $section.$update(function() {

            });

            //$scope.sections = ProjectSection.query({"project_id": project_id});
        }
    }
]);

hicControllers.directive('ngFileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var model = $parse(attrs.ngFileModel);
            var isMultiple = attrs.multiple;
            var modelSetter = model.assign;
            element.bind('change', function () {
                var values = [];
                angular.forEach(element[0].uploadfiles, function (item) {
                    var value = {
                        // File Name
                        name: item.name,
                        //File Size
                        size: item.size,
                        //File URL to view
                        url: URL.createObjectURL(item),
                        // File Input Value
                        _file: item
                    };

                    values.push(value);
                });
                scope.$apply(function () {
                    if (isMultiple) {
                        modelSetter(scope, values);
                    } else {
                        modelSetter(scope, values[0]);
                    }
                });
            });
        }
    };
}]);
