'use strict';

angular.module('MyClinic')
    .controller('UserCtrl', function ($scope, $state, $stateParams, Modal, User, State, Permission) {
        console.log('Params:', $stateParams);

        $scope.states = State.query();
        $scope.permissions = Permission.query();

        if ($stateParams.id) {
            User.get({id: $stateParams.id}, function (user) {
                console.log('user=', user);
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
                            console.log('Response:', resp);
                            // close confirmation window
                            modal.hide();

                            if (resp.code == 'success') {
                                $state.go('userList');
                            }
                        });
                    } else {
                        $scope.user.$save(function (resp) {
                            console.log('Response:', resp);
                            // close confirmation window
                            modal.hide();

                            if (resp.code == 'success') {
                                $state.go('userList');
                            }
                        });
                    }
                }
            });
        };

    })
    .controller('UsersCtrl', function ($scope, Modal, User) {
        $scope.reloadPage = function () {
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