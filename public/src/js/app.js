angular.module('MyClinic', ['ui.router', 'ngResource', 'mgcrea.ngStrap'])
    .run(function ($locale) {
        // set default date formats for current locale
        $locale.DATETIME_FORMATS.short = "dd.MM.yyyy H:mm";
        $locale.DATETIME_FORMATS.shortDate = "dd.MM.yyyy";
    })
    .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
        $locationProvider.html5Mode(true);
        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'partials/home.html',
                controller: 'HomeCtrl'
            })
            .state('patientSearch', {
                url: '/patient/search',
                templateUrl: 'partials/patient/search.html',
                controller: 'PatientSearchCtrl'
            })
            .state('patientCreate', {
                url: '/patient/create',
                templateUrl: 'partials/patient/create.html',
                controller: 'PatientCtrl'
            })
            .state('patientList', {
                url: '/patient/list',
                templateUrl: 'partials/patient/list.html',
                controller: 'PatientsCtrl'
            });
        $urlRouterProvider.otherwise('/');
    })
    .service('Sex', function () {
        this.query = function () {
            return [
                {_id: 'male', title: 'Мужчина'},
                {_id: 'female', title: 'Женщина'}
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
    .controller('HomeCtrl', function ($scope) {

    })
    .controller('PatientSearchCtrl', function ($scope) {

    })
    .controller('PatientCtrl', function ($scope, $state, $modal, Sex, Patient) {
        $scope.sex = Sex.query();
        $scope.patient = new Patient();

        $scope.addPatient = function () {
            // prepare confirmation modal
            $scope.title = 'Подтверждение';
            $scope.content = 'Сохранить изменения?';
            $scope.okAction = function () {
                $scope.patient.$save(function (resp) {
                    // close confirmation window
                    confirmModal.hide();

                    if (resp.code == 'success') {
                        $state.go('patientList');
                    }
                });
            };
            // show=true by default, so this line will show our modal window
            var confirmModal = $modal({scope: $scope, templateUrl: 'partials/_modal_confirmation.html'});
        };

    })
    .controller('PatientsCtrl', function ($scope) {

    });