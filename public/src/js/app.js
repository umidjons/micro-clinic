(function () {
    angular.module('MyClinic', ['ngAnimate', 'ngSanitize', 'ngMessages', 'ngStorage', 'angular-loading-bar',
            'ui.router', 'ngResource', 'mgcrea.ngStrap', 'toaster', 'ui.select',
            'angularUtils.directives.dirPagination', 'ui.tinymce', 'ui.sortable'])
        .run(function ($rootScope, $http, $location, $localStorage, Auth) {
            // keep user logged in after page refresh
            if ($localStorage.currentUser) {
                $rootScope.loggedin = true;
                $rootScope.$localStorage = $localStorage;
                $http.defaults.headers.common.Authorization = 'JWT ' + $localStorage.currentUser.token;
            }

            // redirect to login page if not logged in and trying to access a restricted page
            $rootScope.$on('$locationChangeStart', function (event, next, current) {
                var publicPages = ['/login'];
                var restrictedPage = publicPages.indexOf($location.path()) === -1;

                // if user opens /login page in logged in state, then logout it first
                if ($location.path() == '/login' && $rootScope.loggedin) {
                    Auth.logout();
                }

                if (restrictedPage && !$localStorage.currentUser) {
                    $location.path('/login');
                }
            });
        })
        .run(function ($locale, $rootScope, F) {
            // set default date formats for current locale
            $locale.DATETIME_FORMATS.short = "dd.MM.yyyy H:mm";
            $locale.DATETIME_FORMATS.shortDate = "dd.MM.yyyy";

            // do underscope available on views
            $rootScope._ = _;
            $rootScope.F = F;
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
                .state('login', {
                    url: '/login',
                    templateUrl: 'partials/login.html',
                    controller: 'LoginCtrl'
                })
                .state('settings', {
                    url: '/settings',
                    templateUrl: 'partials/settings/settings.html',
                    controller: 'SettingsCtrl'
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
                    abstract: true,
                    url: '/patient/view/:id',
                    views: {
                        '@': {
                            templateUrl: 'partials/patient/view.html',
                            controller: 'PatientViewCtrl'
                        }
                    }
                })
                .state('patientView.addServices', {
                    url: '/add-services',
                    views: {
                        'patient@patientView': {
                            templateUrl: 'partials/patient/_add-services.html'
                        }
                    }
                })
                .state('patientView.services', {
                    url: '',
                    views: {
                        'patient@patientView': {
                            templateUrl: 'partials/patient/_assigned-services.html'
                        }
                    }
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
                .state('serviceClone', {
                    url: '/service/clone/:id',
                    templateUrl: 'partials/service/clone.html',
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
                })
                .state('partnerInterests', {
                    url: '/partner/interests',
                    templateUrl: 'partials/partner/interests.html',
                    controller: 'PartnerInterestCtrl'
                })
                .state('userList', {
                    url: '/user/list',
                    templateUrl: 'partials/user/list.html',
                    controller: 'UsersCtrl'
                })
                .state('userCreate', {
                    url: '/user/create',
                    templateUrl: 'partials/user/create.html',
                    controller: 'UserCtrl'
                })
                .state('userEdit', {
                    url: '/user/edit/:id',
                    templateUrl: 'partials/user/edit.html',
                    controller: 'UserCtrl'
                })
                .state('cashList', {
                    url: '/cash',
                    templateUrl: 'partials/cash/list.html',
                    controller: 'CashListCtrl'
                })
                .state('cashRegistry', {
                    url: '/cash/registry',
                    templateUrl: 'partials/cash/registry.html',
                    controller: 'CashRegCtrl'
                })
                .state('cashPay', {
                    url: '/pay',
                    templateUrl: 'partials/cash/pay.html',
                    controller: 'CashPayCtrl',
                    params: {
                        patientService: null
                    }
                })
                .state('serviceCategoryList', {
                    url: '/service-category/list',
                    templateUrl: 'partials/service-category/list.html',
                    controller: 'ServiceCategoryListCtrl'
                })
                .state('serviceCategoryCreate', {
                    url: '/service-category/create',
                    templateUrl: 'partials/service-category/create.html',
                    controller: 'ServiceCategoryCtrl'
                })
                .state('serviceCategoryEdit', {
                    url: '/service-category/edit/:id',
                    templateUrl: 'partials/service-category/edit.html',
                    controller: 'ServiceCategoryCtrl'
                })
                .state('branchesList', {
                    url: '/branch/list',
                    templateUrl: 'partials/branch/list.html',
                    controller: 'BranchesCtrl'
                })
                .state('branchCreate', {
                    url: '/branch/create',
                    templateUrl: 'partials/branch/create.html',
                    controller: 'BranchCtrl'
                })
                .state('branchEdit', {
                    url: '/branch/edit/:id',
                    templateUrl: 'partials/branch/edit.html',
                    controller: 'BranchCtrl'
                });
            $urlRouterProvider.otherwise('/');
        })
        .controller('HomeCtrl', function ($scope) {

        })
        .controller('SettingsCtrl', function ($scope, Setting, Modal) {
            $scope.setting = Setting.query();

            $scope.saveSettings = function () {
                Modal.confirm({
                    content: 'Сохранить параметры системы?',
                    okAction: function (modal) {
                        $scope.setting.$save(function () {
                            modal.hide();
                        });
                    }
                });
            };
        });
})();