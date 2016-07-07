(function () {
    'use strict';

    angular.module('MyClinic')
        .controller('LogsCtrl', function ($scope, Modal, Log, Branch) {
            $scope.filter = {
                branch: $scope.$localStorage.currentUser.branch,
                period: {
                    start: Date.create('the beginning of this day'),
                    end: Date.create('the end of this day')
                },
                contexts: [],
                context: undefined,
                methods: [],
                method: undefined,
                levels: [],
                level: undefined
            };

            Branch.query(function (resp) {
                $scope.branches = resp;
            });

            Log.context(function (resp) {
                $scope.filter.contexts = resp;
                $scope.filter.context = undefined;
            });

            Log.method(function (resp) {
                $scope.filter.methods = resp;
                $scope.filter.method = undefined;
            });

            Log.level(function (resp) {
                $scope.filter.levels = resp;
                $scope.filter.level = undefined;
            });

            $scope.reloadPage = function () {
                let params = {
                    start: $scope.filter.period.start,
                    end: $scope.filter.period.end,
                    branch: $scope.filter.branch ? $scope.filter.branch._id : undefined,
                    context: $scope.filter.context ? $scope.filter.context : undefined,
                    method: $scope.filter.method ? $scope.filter.method : undefined,
                    level: $scope.filter.level ? $scope.filter.level : undefined,
                    uid: $scope.filter.userId ? $scope.filter.userId : undefined,
                    login: $scope.filter.username ? $scope.filter.username : undefined
                };
                $scope.logs = Log.query(params);
            };

            $scope.details = function (log) {
                log.opened = !log.opened;
            };

            $scope.reloadPage();
        });
})();