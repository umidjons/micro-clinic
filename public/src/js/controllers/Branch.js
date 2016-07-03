(function () {
    'use strict';

    angular.module('MyClinic')
        .controller('BranchCtrl', function ($scope, $state, $stateParams, Modal, Branch, State, Auth) {
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
                            if (!Auth.hasAccess('branch:edit')) {
                                return;
                            }

                            Branch.update($scope.branch, function (resp) {
                                // close confirmation window
                                modal.hide();

                                if (resp.code == 'success') {
                                    $state.transitionTo('branchEdit', $stateParams, {
                                        reload: true,
                                        inherit: false,
                                        notify: true
                                    });
                                }
                            });
                        } else {
                            if (!Auth.hasAccess('branch:create')) {
                                return;
                            }

                            Branch.save($scope.branch, function (resp) {
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
        .controller('BranchesCtrl', function ($scope, Modal, Branch, Auth) {
            $scope.reloadPage = function () {
                $scope.branches = Branch.query({all: 1});
            };

            $scope.deleteBranch = function (branch) {
                if (!Auth.hasAccess('branch:delete')) {
                    return;
                }

                Modal.confirm({
                    content: 'Удалить филиала?',
                    okAction: function (modal) {
                        if (branch) {
                            Branch.delete({}, {_id: branch._id}, function (resp) {
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