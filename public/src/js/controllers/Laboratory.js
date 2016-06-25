(function () {
    'use strict';

    angular.module('MyClinic')
        .controller('LaboratoryCtrl', function ($scope, $aside, $state, $stateParams, Modal, ServiceCategory, PatientService) {
            ServiceCategory.get({id: 'laboratory'}, function (resp) {
                $scope.categories = resp.subcategories;
                $scope.openTab($scope.categories[0]);
            });

            $scope.openTab = function (subcat) {
                $scope.activeTab = subcat;
                PatientService.laboratory({subcat: subcat._id}, function (resp) {
                    $scope.records = resp.patientServices;
                    $scope.services = resp.services;
                });
            };

            $scope.getService = function (srv, rec) {
                return _.find(rec.services, {serviceId: srv.id});
            };

            $scope.isFinished = function (srv, rec) {
                let service = $scope.getService(srv, rec);

                if (!service) {
                    return null;
                }

                // service found & state is completed
                return service && service.state._id == 'completed';
            };

            $scope.getResult = function (srv, rec) {
                let service = $scope.getService(srv, rec);

                // service not found or no result field there
                if (!service || !service.result) {
                    return null;
                }

                // is there any filled result field
                if (service.result.fields.length > 0) {
                    for (let fld of service.result.fields) {
                        if (typeof fld.value !== 'undefined' && fld.value !== null && fld.value !== '') {
                            return fld.value;
                        }
                    }
                }

                // is there filled content from template
                if (service.result.content &&
                    service.result.content.length > 0 &&
                    service.result.template &&
                    service.result.content != service.result.template.content) {
                    return true;
                }

                // result not ready yet
                return false;
            };

            $scope.getResultValue = function (srv, rec) {
                let res = $scope.getResult(srv, rec);
                return res === true || res === false || res === null ? '' : res;
            };

            $scope.open = function (srv, rec) {
                let patSrv = $scope.getService(srv, rec);
                if (!patSrv) {
                    return;
                }
                $scope.openResult(patSrv);
            };

            $scope.openResult = function (srv) {
                // create and show aside
                $aside({
                    controller: 'ResultCtrl',
                    templateUrl: 'partials/patient/_aside_result.html',
                    title: 'Результат',
                    container: 'body',
                    backdrop: 'static',
                    show: true,
                    resolve: {
                        options: function () {
                            return {
                                // pass data to aside's controller
                                patientService: srv
                            };
                        }
                    }
                });
            };
        });
})();