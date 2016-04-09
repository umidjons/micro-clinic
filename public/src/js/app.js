angular.module('MyClinic', ['ngAnimate', 'angular-loading-bar', 'ui.router', 'ngResource', 'mgcrea.ngStrap', 'toaster'])
    .run(function ($locale) {
        // set default date formats for current locale
        $locale.DATETIME_FORMATS.short = "dd.MM.yyyy H:mm";
        $locale.DATETIME_FORMATS.shortDate = "dd.MM.yyyy";
    })
    .config(function (cfpLoadingBarProvider) {
        cfpLoadingBarProvider.includeSpinner = false;
    })
    .config(function ($httpProvider) {
        $httpProvider.interceptors.unshift(function ($q, toaster) {
            return {
                response: function (response) {
                    var hMsg = response.headers('X-MSG');
                    console.log('X-MSG:', decodeURI(hMsg));
                    if (hMsg) {
                        hMsg = decodeURI(hMsg);
                        var xMessages = JSON.parse(hMsg);
                        if (xMessages.length > 0)
                            xMessages.forEach(function (xMsg) {
                                if (xMsg.message) {
                                    switch (xMsg.code) {
                                        case 'success':
                                        case 'warning':
                                        case 'error':
                                            toaster.pop(xMsg.code, '', xMsg.message);
                                            break;
                                        default:
                                            toaster.pop('info', '', xMsg.message);
                                            break;
                                    }
                                }
                            });
                    }
                    return response || $q.when(response);
                },
                responseError: function (response) {
                    return $q.reject(response);
                }
            };
        });
    })
    .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
        //$locationProvider.html5Mode(true);
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
            .state('patientEdit', {
                url: '/patient/edit/:id',
                templateUrl: 'partials/patient/edit.html',
                controller: 'PatientCtrl'
            })
            .state('patientList', {
                url: '/patient/list',
                templateUrl: 'partials/patient/list.html',
                controller: 'PatientsCtrl'
            })
            .state('serviceList', {
                url: '/service/list',
                templateUrl: 'partials/service/list.html',
                controller: 'ServicesCtrl'
            })
            .state('serviceCreate', {
                url: '/service/create',
                templateUrl: 'partials/service/create.html',
                controller: 'ServiceCtrl'
            })
            .state('serviceEdit', {
                url: '/service/edit/:id',
                templateUrl: 'partials/service/edit.html',
                controller: 'ServiceCtrl'
            });
        $urlRouterProvider.otherwise('/');
    })
    .controller('HomeCtrl', function ($scope) {

    });