var hic = angular.module('hic', ['ngRoute', 'hicControllers', 'hicServices']);

hic.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider
            .when('/projects', {
                templateUrl: 'projects.html',
                controller: 'projectsController'
            })
            .when('/translations/:project_id', {
                templateUrl: 'translations.html',
                controller: 'translationsController'
            })
            .when('/translations/by-lang/:project_id/:language_id', {
                templateUrl: 'translations-by-lang.html',
                controller: 'translationByLangController'
            })
            .when('/translations/by-key/:project_id/:key_id', {
                templateUrl: 'translations-by-key.html',
                controller: 'translationByKeyController'
            })

            .when('/export/:type/:project_id', {
                controller: 'exportController'
            })

            .when('/import/:type/project/:project_id', {
                templateUrl: 'import-overview.html',
                controller: 'importController'
            })
            .otherwise({
                redirectTo: '/projects'
            })
    }
]);
