(function () {
    'use strict';

    angular.module('MyClinic')
        .controller('BranchCtrl', function ($scope, $state, $stateParams, Modal, Branch, State) {
            $scope.states = State.query();

            if ($stateParams.id) {
                Branch.get({id: $stateParams.id}, function (branch) {
                    $scope.branch = branch;
                });
            } else {
                $scope.branch = new Branch();
            }

            $scope.saveBranch = function () {
                Modal.confirm({
                    okAction: function (modal) {
                        if ($scope.branch._id) {
                            $scope.branch.$update(function (resp) {
                                // close confirmation window
                                modal.hide();

                                if (resp.code == 'success') {
                                    $state.go('branchesList');
                                }
                            });
                        } else {
                            $scope.branch.$save(function (resp) {
                                // close confirmation window
                                modal.hide();

                                if (resp.code == 'success') {
                                    $state.go('branchesList');
                                }
                            });
                        }
                    }
                });
            };

        })
        .controller('BranchesCtrl', function ($scope, Modal, Branch) {
            $scope.reloadPage = function () {
                $scope.branches = Branch.query({all: 1});
            };

            $scope.deleteBranch = function (branch) {
                Modal.confirm({
                    content: 'Удалить филиала?',
                    okAction: function (modal) {
                        if (branch) {
                            branch.$delete(function (resp) {
                                // close confirmation window
                                modal.hide();

                                if (resp.code == 'success') {
                                    $scope.reloadPage();
                                }
                            });
                        }
                    }
                });
            };

            $scope.reloadPage();
        });
})();