'use strict';

angular.module('MyClinic')
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
    })
    .controller('PatientViewCtrl', function ($scope, $state, $stateParams, Patient, Partner, Service, ServiceCategory) {
        ServiceCategory.categoriesWithServices(function (categories) {
            $scope.categories = _.pluck(categories, '_id');
        });
        $scope.services = Service.servicesWithCategory();
        $scope.partners = Partner.query();

        $scope.getServicesByCategory = function (catTitle) {
            return _.where($scope.services, {categoryTitle: catTitle});
        };
        $scope.getServicesByCategoryTotal = function (catTitle) {
            var srvList = $scope.getServicesByCategory(catTitle);
            return _.reduce(srvList, function (memo, srv) {
                return memo + srv.price;
            }, 0);
        };

        $scope.selectAllService = function (categoryTitle) {
            var srvList = $scope.getServicesByCategory(categoryTitle);
            for (let srv of srvList) {
                $scope.selectService(srv);
            }
        };

        $scope.selectService = function (srv, qnt) {
            var found = _.find($scope.patient.services, {_id: srv._id});
            qnt = qnt || 1;
            if (found) {
                if ((found.quantity > 1 && qnt < 0) || qnt > 0)
                    found.quantity += qnt;
                $scope.calcService(found);
            } else {
                var service = angular.copy(srv);
                service.quantity = 1;
                $scope.calcService(service);
                $scope.patient.services.push(service);
            }
        };

        $scope.deselectService = function (idx) {
            $scope.patient.services.splice(idx, 1);
        };

        $scope.openDiscount = function (srv) {
            srv.discount = srv.discount || 0;
            srv.discountWindow = true;
        };

        $scope.setDiscount = function (srv) {
            if (!srv.discount) {
                srv.discountNote = '';
            }
            $scope.calcService(srv);
            srv.discountWindow = false;
        };

        $scope.openPartner = function (srv) {
            srv.partnerWindow = true;
        };

        $scope.closePartnerWindow = function (srv) {
            srv.partnerWindow = false;
        };

        $scope.setPartner = function (partner, srv) {
            srv.partner = partner;
            srv.partnerWindow = false;
        };

        $scope.calcService = function (srv) {
            srv.priceTotal = srv.quantity * srv.price;
            if (srv.discount > 0) {
                srv.priceTotal -= srv.priceTotal * 0.01 * srv.discount;
            }
        };

        Patient.get({id: $stateParams.id}, function (patient) {
            $scope.patient = patient;
            $scope.patient.services = [];
        });

        //todo: output totals (quantity and price) in table footer
        //todo: create 2 pages: 1) add new services 2) services history (оказанные услуги)
    });