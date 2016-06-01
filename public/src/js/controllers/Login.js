(function () {
    'use strict';

    angular.module('MyClinic')
        .controller('LoginCtrl', function ($scope, $state, $stateParams, Modal, Auth, Branch) {
            //todo: delete default login and password
            $scope.username = 'umidjons';
            $scope.password = 123456;

            $scope.branches = Branch.activeBranches();

            $scope.login = function () {
                Auth.login($scope.username, $scope.password, $scope.branch, function (result) {
                    if (result === true) {
                        $state.go('home');
                    }
                });
            };

            $scope.logout = function () {
                Auth.logout();
                $state.go('login');
            };
        });
})();