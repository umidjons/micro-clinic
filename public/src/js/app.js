(function () {
    angular.module('MyClinic', ['ngAnimate', 'ngSanitize', 'ngMessages', 'ngStorage', 'angular-loading-bar',
            'ui.router', 'ui.router.state.events', 'ngResource', 'mgcrea.ngStrap', 'toaster', 'ui.select',
            'angularUtils.directives.dirPagination', 'ui.tinymce', 'ui.sortable', 'cfp.hotkeys', 'jsonFormatter'])
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
        .run(function ($rootScope, Auth, $state) {
            // check privileges to specific states (routes/pages/views)
            $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams, options) {
                if (toState.permission && !Auth.hasAccess(toState.permission)) {
                    event.preventDefault();
                    if (fromState.name == '') {
                        $state.go('home');
                    } else {
                        $state.transitionTo(fromState, fromParams, {
                            reload: true,
                            inherit: false,
                            notify: true
                        });
                    }
                }
            });
        })
        .config(function (cfpLoadingBarProvider) {
            cfpLoadingBarProvider.includeSpinner = false;
        })
        .config(function ($httpProvider) {
            $httpProvider.interceptors.unshift(function ($q, toaster, $location) {
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
                        // if unauthorized error is detected, redirect to the login page
                        if (response.status == 401)
                            $location.path('/login');

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
                    controller: 'SettingsCtrl',
                    permission: 'admin:settings'
                })
                .state('patientSearch', {
                    url: '/patient/search',
                    templateUrl: 'partials/patient/search.html',
                    controller: 'PatientSearchCtrl',
                    permission: 'search'
                })
                .state('patientCreate', {
                    url: '/patient/create',
                    templateUrl: 'partials/patient/create.html',
                    controller: 'PatientCtrl',
                    permission: 'patient:create',
                    params: {
                        initialPatient: null
                    }
                })
                .state('patientEdit', {
                    url: '/patient/edit/:id',
                    templateUrl: 'partials/patient/edit.html',
                    controller: 'PatientCtrl',
                    permission: 'patient:edit'
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
                    },
                    permission: 'patient:service:add'
                })
                .state('patientView.services', {
                    url: '',
                    views: {
                        'patient@patientView': {
                            templateUrl: 'partials/patient/_assigned-services.html'
                        }
                    },
                    permission: 'patient:view'
                })
                .state('patientList', {
                    url: '/patient/list',
                    templateUrl: 'partials/patient/list.html',
                    controller: 'PatientsCtrl',
                    permission: 'patient:list'
                })
                .state('serviceList', {
                    url: '/service/list',
                    templateUrl: 'partials/service/list.html',
                    controller: 'ServicesCtrl',
                    permission: 'service:list'
                })
                .state('serviceCreate', {
                    url: '/service/create',
                    templateUrl: 'partials/service/create.html',
                    controller: 'ServiceCtrl',
                    permission: 'service:create'
                })
                .state('serviceEdit', {
                    url: '/service/edit/:id',
                    templateUrl: 'partials/service/edit.html',
                    controller: 'ServiceCtrl',
                    permission: 'service:edit'
                })
                .state('serviceClone', {
                    url: '/service/clone/:id',
                    templateUrl: 'partials/service/clone.html',
                    controller: 'ServiceCtrl',
                    permission: 'service:create'
                })
                .state('serviceView', {
                    url: '/service/view/:id',
                    templateUrl: 'partials/service/view.html',
                    controller: 'ServiceViewCtrl'
                })
                .state('partnerList', {
                    url: '/partner/list',
                    templateUrl: 'partials/partner/list.html',
                    controller: 'PartnersCtrl',
                    permission: 'partner:list'
                })
                .state('partnerCreate', {
                    url: '/partner/create',
                    templateUrl: 'partials/partner/create.html',
                    controller: 'PartnerCtrl',
                    permission: 'partner:create'
                })
                .state('partnerEdit', {
                    url: '/partner/edit/:id',
                    templateUrl: 'partials/partner/edit.html',
                    controller: 'PartnerCtrl',
                    permission: 'partner:edit'
                })
                .state('partnerView', {
                    url: '/partner/view/:id',
                    templateUrl: 'partials/partner/view.html',
                    controller: 'PartnerViewCtrl'
                })
                .state('partnerInterests', {
                    url: '/partner/interests/:id',
                    params: {
                        id: null
                    },
                    templateUrl: 'partials/partner/interests.html',
                    controller: 'PartnerInterestCtrl',
                    permission: 'report:partnerInterests'
                })
                .state('userList', {
                    url: '/user/list',
                    templateUrl: 'partials/user/list.html',
                    controller: 'UsersCtrl',
                    permission: 'user:list'
                })
                .state('userCreate', {
                    url: '/user/create',
                    templateUrl: 'partials/user/create.html',
                    controller: 'UserCtrl',
                    permission: 'user:create'
                })
                .state('userEdit', {
                    url: '/user/edit/:id',
                    templateUrl: 'partials/user/edit.html',
                    controller: 'UserCtrl',
                    permission: 'user:edit'
                })
                .state('cashList', {
                    url: '/cash',
                    templateUrl: 'partials/cash/list.html',
                    controller: 'CashListCtrl',
                    permission: 'cash:pay'
                })
                .state('cashRegistry', {
                    url: '/cash/registry',
                    templateUrl: 'partials/cash/registry.html',
                    controller: 'CashRegCtrl',
                    permission: 'cash:registry'
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
                    controller: 'ServiceCategoryListCtrl',
                    permission: 'category:list'
                })
                .state('serviceCategoryCreate', {
                    url: '/service-category/create',
                    templateUrl: 'partials/service-category/create.html',
                    controller: 'ServiceCategoryCtrl',
                    permission: 'category:create'
                })
                .state('serviceCategoryEdit', {
                    url: '/service-category/edit/:id',
                    templateUrl: 'partials/service-category/edit.html',
                    controller: 'ServiceCategoryCtrl',
                    permission: 'category:edit'
                })
                .state('branchesList', {
                    url: '/branch/list',
                    templateUrl: 'partials/branch/list.html',
                    controller: 'BranchesCtrl',
                    permission: 'branch:list'
                })
                .state('branchCreate', {
                    url: '/branch/create',
                    templateUrl: 'partials/branch/create.html',
                    controller: 'BranchCtrl',
                    permission: 'branch:create'
                })
                .state('branchEdit', {
                    url: '/branch/edit/:id',
                    templateUrl: 'partials/branch/edit.html',
                    controller: 'BranchCtrl',
                    permission: 'branch:edit'
                })
                .state('companyList', {
                    url: '/company/list',
                    templateUrl: 'partials/company/list.html',
                    controller: 'CompaniesCtrl',
                    permission: 'company:list'
                })
                .state('companyCreate', {
                    url: '/company/create',
                    templateUrl: 'partials/company/create.html',
                    controller: 'CompanyCtrl',
                    permission: 'company:create'
                })
                .state('companyEdit', {
                    url: '/company/edit/:id',
                    templateUrl: 'partials/company/edit.html',
                    controller: 'CompanyCtrl',
                    permission: 'company:edit'
                })
                .state('companyDetails', {
                    url: '/company/details/:id',
                    templateUrl: 'partials/company/details.html',
                    controller: 'CompanyDetailsCtrl',
                    permission: 'company:details'
                })
                .state('companyPay', {
                    url: '/company/pay/:id',
                    templateUrl: 'partials/company/pay.html',
                    controller: 'CompanyPayCtrl',
                    permission: 'company:pay'
                })
                .state('laboratory', {
                    url: '/laboratory',
                    templateUrl: 'partials/laboratory/laboratory.html',
                    controller: 'LaboratoryCtrl',
                    permission: 'laboratory'
                })
                .state('laboratoryAllResults', {
                    url: '/laboratory/results/:id',
                    templateUrl: 'partials/laboratory/results.html',
                    controller: 'LaboratoryResultsCtrl',
                    permission: 'patient:service:results'
                })
                .state('log', {
                    url: '/log',
                    templateUrl: 'partials/log/list.html',
                    controller: 'LogsCtrl',
                    permission: 'admin:logs'
                });
            $urlRouterProvider.otherwise('/');
        })
        .directive('access', function ($rootScope) {
            return {
                restrict: 'A',
                link: function (scope, elem, attrs) {
                    // if element is not available yet, just return
                    if (!elem) {
                        return;
                    }

                    // by default hide element
                    elem.hide();

                    let key = attrs.access;

                    if (!key) {
                        // no permission name provided
                        return elem.remove();
                    }

                    let permissions = [];

                    if ($rootScope.$localStorage &&
                        $rootScope.$localStorage.currentUser &&
                        $rootScope.$localStorage.currentUser.permissions
                    ) {
                        permissions = $rootScope.$localStorage.currentUser.permissions;
                    } else {
                        // no permissions found
                        return elem.remove();
                    }

                    if (key in permissions && permissions[key] === true) {
                        // the current user has enough privilege
                        return elem.show();
                    }

                    // hasn't enough privilege
                    elem.remove();
                }
            };
        })
        .controller('HomeCtrl', function ($scope) {

        })
        .controller('SettingsCtrl', function ($scope, Setting, Modal, Auth) {
            $scope.setting = Setting.query();

            $scope.saveSettings = function () {
                if (!Auth.hasAccess('admin:settings'))
                    return;

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