(function () {
    'use strict';

    angular.module('MyClinic')
        .controller('LogsCtrl', function ($scope, Modal, Log) {
            $scope.reloadPage = function () {
                $scope.logs = Log.query();
            };

            $scope.details = function (log) {
                log.opened = !log.opened;
            };

            $scope.reloadPage();
        });
})();