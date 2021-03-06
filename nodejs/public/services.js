var hicServices = angular.module('hicServices', ['ngResource']);

hicServices.factory('Project', ['$resource',
    function ($resource) {
        return $resource('/api/projects', { id: '@id'}, {
            update: {method: 'PUT'},
            query: {method: 'GET', isArray: true},
            get: {method: 'GET'},
            delete: {method: 'DELETE'}
        });
    }
]);

hicServices.factory('ProjectKey', ['$resource',
    function ($resource) {
        return $resource('/api/project/keys', { id: '@id', project_id: '@project_id'}, {
            update: {method: 'PUT'},
            query: {method: 'GET', isArray: true},
            get: {method: 'GET'},
            delete: {method: 'DELETE'}
        });
    }
]);

hicServices.factory('ProjectTranslations', ['$resource',
    function ($resource) {
        return $resource('/api/project/:project_id/translations', {}, {});
    }
]);

hicServices.factory('ProjectTranslationsMatrix', ['$resource',
    function ($resource) {
        return $resource('/api/project/matrix', {}, {
            update: {method: 'PUT'},
            query: {method: 'GET', isArray: true},
            get: {method: 'GET'},
            delete: {method: 'DELETE'}
        });
    }
]);

hicServices.factory('Language', ['$resource',
    function ($resource) {
        return $resource('/api/languages', {}, {});
    }
]);


hicServices.factory('Import', ['$resource',
    function ($resource) {
        return $resource('/api/import', {}, {});
    }
]);

hicServices.factory('ProjectSection', ['$resource',
    function ($resource) {
        return $resource('/api/project/sections', { id: '@id', project_id: '@project_id'}, {
            update: {method: 'PUT'},
            query: {method: 'GET', isArray: true},
            get: {method: 'GET'},
            delete: {method: 'DELETE'}
        });
    }
]);