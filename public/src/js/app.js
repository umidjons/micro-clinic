angular.module('MyClinic', ['ui.router', 'ngResource'])
    .config(function ($stateProvider, $urlRouterProvider) {
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
    .controller('HomeCtrl', function ($scope) {
        
    })
    .controller('PatientSearchCtrl', function ($scope) {

    })
    .controller('PatientCtrl', function ($scope) {

    })
    .controller('PatientsCtrl', function ($scope) {

    });