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

hicControllers.controller('translationsController', ['$scope', 'Project', 'ProjectKey', 'ProjectSection', 'ProjectTranslationsMatrix', 'Language', '$routeParams', '$http',
    function ($scope, Project, ProjectKey, ProjectSection, ProjectTranslationsMatrix, Language, $routeParams, $http) {
        var project_id = $routeParams.project_id;

        var $sections = ProjectSection.query({"project_id": project_id});

        $scope.project = Project.get({"project_id": project_id});
        $scope.projects = Project.query();
        $scope.languages = Language.query();

        var matrix = [];

        $sections.$promise.then(function ($results) {
            angular.forEach($results, function ($section) {
                var $translations = ProjectTranslationsMatrix.get({
                    "project_id": project_id,
                    "project_section_id": $section.id !== null ? $section.id : -1
                });

                var projectKeys = ProjectKey.query({"project_id": project_id, "project_section_id": $section.id !== null ? $section.id : -1});

                matrix.push({
                    "section": $section.name,
                    "section_id": $section.id,
                    "projectKeys": projectKeys,
                    "translations": $translations
                });
            });
        });

        $scope.matrix = matrix;



        $scope.createKey = function () {
            var name = $scope.keyName;

            var data = new ProjectKey();
            data.project_id = project_id;
            data.name = name;

            data.$save();

            $scope.keys = ProjectKey.query({"project_id": project_id});
            $scope.keyName = '';
        };

        $scope.getCssStyle = function ($val) {
            return $val ? "text-center bg-success text-success" : "text-center bg-warning text-muted";
        };

        $scope.isProjectSelectedCss = function ($project) {
            if ($project.id == $routeParams.project_id) {
                return "active";
            } else {
                return "";
            }
        };

        $scope.getSectionKeyCount = function($section) {
            console.log($section.projectKeys.length);

            return $section.projectKeys.length;
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

hicControllers.controller('translationByKeyController', ['$scope', 'Project', 'ProjectKey', 'ProjectTranslations', 'ProjectSection', '$routeParams', '$http',
    function ($scope, Project, ProjectKey, ProjectTranslations, ProjectSection, $routeParams, $http) {
        var project_id = $routeParams.project_id;
        var key_id = $routeParams.key_id;

        $scope.projectKey = ProjectKey.get({"id": key_id, "project_id": project_id});
        $scope.projectKeys = ProjectKey.query({"project_id": project_id});
        $scope.project = Project.get({"project_id": project_id});
        $scope.sections = ProjectSection.query({"project_id": project_id});
        $scope.translations = ProjectTranslations.query({"project_id": project_id, "key_id": key_id});

        $scope.updateProjectKey = function ($key) {
            $key.$update(function () {
                $scope.projectKey = ProjectKey.get({"id": key_id, "project_id": project_id});
            });
        };

        $scope.deleteProjectKey = function ($key) {
            if (confirm("Are you sure you want to delete '" + $key.code + "'?")) {
                $key.$delete(function () {
                    //ignore
                });
            }
        }

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

        $scope.getSelectedKeyCss = function ($key) {
            return $key.id == key_id ? "active" : "";
        };
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

                if ($file.files.length === 1) {
                    var $languageId = $file.dataset.language;
                    var $projectId = $file.dataset.project;

                    var r = new FileReader();

                    r.onloadend = function (e) {
                        var result = e.target.result;

                        var data = new Import();
                        data.project_id = $projectId;
                        data.language_id = $languageId;
                        data.type = $scope.import_type.toUpperCase();

                        if ($scope.import_type.toUpperCase() === 'ANDROID') {
                            data.xml = result;
                            data.$save();
                        } else if ($scope.import_type.toUpperCase() === 'IOS'
                                || $scope.import_type.toUpperCase() === 'PROPERTY') {
                            data.properties = result;
                            data.$save();
                        } else if ($scope.import_type.toUpperCase() === 'XLS') {
                            data.xls = btoa(result);
                            data.$save();
                        }
                    };

                    r.readAsBinaryString($file.files[0]);
                }
            }
        };
    }
]);

hicControllers.controller('manageProjectController', ['$scope', '$location', 'Project', '$routeParams', '$http',
    function ($scope, $location, Project, $routeParams, $http) {
        var project_id = $routeParams.project_id;

        $scope.project = Project.get({"project_id": project_id});

        $scope.updateProject = function ($project) {
            $project.id = project_id;

            $project.$update(function () {
                $scope.project = Project.get({"project_id": project_id});
            });
        };

        $scope.deleteProject = function ($project) {
            $project.id = $routeParams.project_id;

            if (confirm("Are you sure you want to remove the project '" + $project.name + "'?")) {
                $project.$delete(function () {
                    $location.path('/projects');
                });
            }
        };
    }
]);

hicControllers.controller('manageProjectSectionsController', ['$scope', 'Project', 'ProjectSection', '$routeParams', '$http',
    function ($scope, Project, ProjectSection, $routeParams, $http) {
        var project_id = $routeParams.project_id;

        $scope.project = Project.get({"project_id": project_id});
        $scope.sections = ProjectSection.query({"project_id": project_id});


        $scope.createSection = function () {
            var name = $scope.name;

            var data = new ProjectSection();
            data.project_id = project_id;
            data.name = name;

            data.$save();

            $scope.sections = ProjectSection.query({"project_id": project_id});
            $scope.name = '';
        };

        $scope.updateSection = function ($section) {
            $section.project_id = $routeParams.project_id;

            $section.$update(function () {
                //ignore
            });
        };

        $scope.deleteSection = function ($section) {
            $section.project_id = $routeParams.project_id;

            if (confirm("Are you sure you want to remove the section '" + $section.name + "'?")) {
                $section.$delete(function () {
                    $scope.sections = ProjectSection.query({"project_id": project_id});
                });
            }
        };
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
