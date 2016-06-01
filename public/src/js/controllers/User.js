'use strict';

angular.module('MyClinic')
    .controller('UserCtrl', function ($scope, $state, $stateParams, Modal, User, State, Permission) {
        $scope.states = State.query();
        $scope.permissions = Permission.query();

        if ($stateParams.id) {
            User.get({id: $stateParams.id}, function (user) {
                // empty password
                user.password = '';

                $scope.user = user;
            });
        } else {
            $scope.user = new User();
        }

        $scope.saveUser = function () {
            Modal.confirm({
                okAction: function (modal) {
                    if ($scope.user._id) {
                        $scope.user.$update(function (resp) {
                            // close confirmation window
                            modal.hide();

                            if (resp.code == 'success') {
                                $state.transitionTo('userEdit', $stateParams, {
                                    reload: true,
                                    inherit: false,
                                    notify: true
                                });
                            }
                        });
                    } else {
                        $scope.user.$save(function (resp) {
                            // close confirmation window
                            modal.hide();

                            if (resp.userId) {
                                $state.go('userEdit', {id: resp.userId});
                            }
                        });
                    }
                }
            });
        };

    })
    .controller('UsersCtrl', function ($scope, Modal, User, Permission) {
        $scope.reloadPage = function () {
            $scope.permissions = Permission.query();
            $scope.users = User.query();
        };

        $scope.deleteUser = function (user) {
            Modal.confirm({
                content: 'Удалить пользователя?',
                okAction: function (modal) {
                    if (user) {
                        user.$delete(function (resp) {
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