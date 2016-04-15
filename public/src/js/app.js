angular.module('MyClinic', ['ngAnimate', 'ngSanitize', 'angular-loading-bar', 'ui.router', 'ngResource', 'mgcrea.ngStrap', 'toaster', 'ui.select'])
    .run(function ($locale, $rootScope) {
        // set default date formats for current locale
        $locale.DATETIME_FORMATS.short = "dd.MM.yyyy H:mm";
        $locale.DATETIME_FORMATS.shortDate = "dd.MM.yyyy";

        // do underscope available on views
        $rootScope._ = _;
    })
    .config(function (cfpLoadingBarProvider) {
        cfpLoadingBarProvider.includeSpinner = false;
    })
    .config(function ($httpProvider) {
        $httpProvider.interceptors.unshift(function ($q, toaster) {
            return {
                response: function (response) {
                    var hMsg = response.headers('X-MSG');
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
                controller: 'PatientCtrl',
                params: {
                    initialPatient: null
                }
            })
            .state('patientEdit', {
                url: '/patient/edit/:id',
                templateUrl: 'partials/patient/edit.html',
                controller: 'PatientCtrl'
            })
            .state('patientView', {
                url: '/patient/view/:id',
                templateUrl: 'partials/patient/view.html',
                controller: 'PatientViewCtrl'
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
            })
            .state('serviceView', {
                url: '/service/view/:id',
                templateUrl: 'partials/service/view.html',
                controller: 'ServiceViewCtrl'
            })
            .state('partnerList', {
                url: '/partner/list',
                templateUrl: 'partials/partner/list.html',
                controller: 'PartnersCtrl'
            })
            .state('partnerCreate', {
                url: '/partner/create',
                templateUrl: 'partials/partner/create.html',
                controller: 'PartnerCtrl'
            })
            .state('partnerEdit', {
                url: '/partner/edit/:id',
                templateUrl: 'partials/partner/edit.html',
                controller: 'PartnerCtrl'
            })
            .state('partnerView', {
                url: '/partner/view/:id',
                templateUrl: 'partials/partner/view.html',
                controller: 'PartnerViewCtrl'
            });
        $urlRouterProvider.otherwise('/');
    })
    .controller('HomeCtrl', function ($scope) {

    });