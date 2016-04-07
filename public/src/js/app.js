angular.module('MyClinic', ['ngAnimate', 'ui.router', 'ngResource', 'mgcrea.ngStrap', 'toaster'])
    .run(function ($locale) {
        // set default date formats for current locale
        $locale.DATETIME_FORMATS.short = "dd.MM.yyyy H:mm";
        $locale.DATETIME_FORMATS.shortDate = "dd.MM.yyyy";
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
    .controller('PatientCtrl', function ($scope, $state, $stateParams, $modal, Sex, Patient) {
        $scope.sex = Sex.query();

        console.log('Params:', $stateParams);

        if ($stateParams.id) {
            Patient.get({id: $stateParams.id}, function (patient) {
                $scope.patient = patient;
            });
        } else {
            $scope.patient = new Patient();
        }

        $scope.savePatient = function () {
            // prepare confirmation modal
            $scope.title = 'Подтверждение';
            $scope.content = 'Сохранить изменения?';
            $scope.okAction = function () {
                if ($scope.patient._id) {
                    $scope.patient.$update(function (resp) {
                        console.log('Response:', resp);
                        // close confirmation window
                        confirmModal.hide();

                        if (resp.code == 'success') {
                            $state.go('patientList');
                        }
                    });
                } else {
                    $scope.patient.$save(function (resp) {
                        console.log('Response:', resp);
                        // close confirmation window
                        confirmModal.hide();

                        if (resp.code == 'success') {
                            $state.go('patientList');
                        }
                    });
                }
            };
            // show=true by default, so this line will show our modal window
            var confirmModal = $modal({scope: $scope, templateUrl: 'partials/_modal_confirmation.html'});
        };

    })
    .controller('PatientsCtrl', function ($scope, $modal, Patient) {
        $scope.reloadPage = function () {
            $scope.patients = Patient.query();
        };

        $scope.deletePatient = function (patient) {
            // prepare confirmation modal
            $scope.title = 'Подтверждение';
            $scope.content = 'Удалить пациента?';
            $scope.okAction = function () {
                if (patient) {
                    patient.$delete(function (resp) {
                        console.log('Response:', resp);
                        // close confirmation window
                        confirmModal.hide();

                        if (resp.code == 'success') {
                            $scope.reloadPage();
                        }
                    });
                }
            };
            // show=true by default, so this line will show our modal window
            var confirmModal = $modal({scope: $scope, templateUrl: 'partials/_modal_confirmation.html'});
        };

        $scope.reloadPage();
    });