var hicServices = angular.module('hicServices', ['ngResource']);

hicServices.factory('Project', ['$resource',
    function ($resource) {
        return $resource('/api/projects', {}, {});
    }
]);

hicServices.factory('ProjectKey', ['$resource',
    function ($resource) {
        return $resource('/api/project/:project_id/keys', {}, {});
    }
]);

hicServices.factory('ProjectTranslations', ['$resource',
    function ($resource) {
        return $resource('/api/project/:project_id/translations', {}, {});
    }
]);

hicServices.factory('ProjectTranslationsMatrix', ['$resource',
    function ($resource) {
        return $resource('/api/project/:project_id/matrix', {}, {});
    }
]);

hicServices.factory('Language', ['$resource',
    function ($resource) {
        return $resource('/api/languages', {}, {});
    }
]);
