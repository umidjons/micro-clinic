angular.module('MyClinic')
    .controller('ServicesCtrl', function ($scope, Modal, Service) {
        $scope.reloadPage = function () {
            $scope.services = Service.query();
        };

        $scope.deleteService = function (service) {
            Modal.confirm({
                content: 'Удалить услугу?',
                okAction: function (modal) {
                    if (service) {
                        service.$delete(function (resp) {
                            console.log('Response:', resp);
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
    })
    .controller('ServiceCtrl', function ($scope, $state, $stateParams, Modal, State, ServiceCategory, Service) {
        $scope.serviceCategories = ServiceCategory.query();
        $scope.states = State.query();

        console.log('Params:', $stateParams);

        if ($stateParams.id) {
            Service.get({id: $stateParams.id}, function (service) {
                $scope.service = service;
            });
        } else {
            $scope.service = new Service();
        }

        $scope.saveService = function () {
            Modal.confirm({
                okAction: function (modal) {
                    if ($scope.service._id) {
                        $scope.service.$update(function (resp) {
                            console.log('Response:', resp);
                            // close confirmation window
                            modal.hide();

                            if (resp.code == 'success') {
                                $state.go('serviceList');
                            }
                        });
                    } else {
                        $scope.service.$save(function (resp) {
                            console.log('Response:', resp);
                            // close confirmation window
                            modal.hide();

                            if (resp.code == 'success') {
                                $state.go('serviceList');
                            }
                        });
                    }
                }
            });
        };

    })
    .controller('ServiceViewCtrl', function ($scope, $state, $stateParams, Service) {
        Service.get({id: $stateParams.id}, function (service) {
            $scope.service = service;
        });
    });