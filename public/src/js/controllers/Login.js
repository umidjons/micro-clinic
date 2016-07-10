(function () {
    'use strict';

    angular.module('MyClinic')
        .controller('LoginCtrl', function ($scope, $state, $stateParams, Modal, Auth, Branch) {
            //todo: delete default login and password
            $scope.username = '';
            $scope.password = '';

            $scope.branches = Branch.activeBranches();

            $scope.login = function () {
                Auth.login($scope.username, $scope.password, $scope.branch, function (result) {
                    if (result === true) {
                        let sRef = 'home';

                        if ($scope.$localStorage &&
                            $scope.$localStorage.currentUser &&
                            $scope.$localStorage.currentUser.preferences &&
                            $scope.$localStorage.currentUser.preferences.homePage) {
                            sRef = $scope.$localStorage.currentUser.preferences.homePage;
                        }

                        $state.go(sRef);
                    }
                });
            };

            $scope.logout = function () {
                Auth.logout();
                $state.go('login');
            };
        });
})();