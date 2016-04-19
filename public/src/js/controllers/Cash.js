'use strict';

angular.module('MyClinic')
    .controller('CashListCtrl', function ($scope, Cash) {
        $scope.records = Cash.pendingPatients();

        $scope.toggleDetails = function (patSrv) {
            patSrv.windowPendingServices = !!!patSrv.windowPendingServices;
            if (patSrv.windowPendingServices && !patSrv.pendingServices) {
                patSrv.pendingServices = Cash.pendingServicesOf({patientId: patSrv.patient._id});
            }
        }
    });