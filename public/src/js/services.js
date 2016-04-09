angular.module('MyClinic')
    .service('Sex', function () {
        this.query = function () {
            return [
                {_id: 'male', title: 'Мужчина'},
                {_id: 'female', title: 'Женщина'}
            ];
        }
    })
    .service('State', function () {
        this.query = function () {
            return [
                {_id: 'active', title: 'Активный'},
                {_id: 'blocked', title: 'Заблокирован'}
            ];
        }
    })
    .factory('Patient', function ($resource) {
        return $resource(
            '/patient/:id', // URL to patient backend API
            {id: '@_id'}, // obtain id from _id field of patient object
            {
                update: {
                    method: 'PUT' // for .update() method use PUT request
                }
            }
        );
    })
    .factory('ServiceCategory', function ($resource) {
        return $resource(
            '/service-category/:id',
            {id: '@_id'},
            {
                update: {
                    method: 'PUT'
                }
            }
        );
    })
    .factory('Service', function ($resource) {
        return $resource(
            '/service/:id',
            {id: '@_id'},
            {
                update: {
                    method: 'PUT'
                }
            }
        );
    });