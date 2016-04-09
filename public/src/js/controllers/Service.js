angular.module('MyClinic')
    .controller('ServicesCtrl', function ($scope, $modal, Service) {
        $scope.reloadPage = function () {
            $scope.services = Service.query();
        };

        $scope.deleteService = function (service) {
            // prepare confirmation modal
            $scope.title = 'Подтверждение';
            $scope.content = 'Удалить услугу?';
            $scope.okAction = function () {
                if (service) {
                    service.$delete(function (resp) {
                        console.log('Response:', resp);
                        // close confirmation window
                        confirmModal.hide();

                        if (resp.code == 'success') {
                            $scope.reloadPage();
                        }
                    });
                }
            };
            // show=true by default, so this line will show our modal window
            var confirmModal = $modal({scope: $scope, templateUrl: 'partials/_modal_confirmation.html'});
        };

        $scope.reloadPage();
    })
    .controller('ServiceCtrl', function ($scope, $state, $stateParams, $modal, State, ServiceCategory, Service) {
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
            // prepare confirmation modal
            $scope.title = 'Подтверждение';
            $scope.content = 'Сохранить изменения?';
            $scope.okAction = function () {
                if ($scope.service._id) {
                    $scope.service.$update(function (resp) {
                        console.log('Response:', resp);
                        // close confirmation window
                        confirmModal.hide();

                        if (resp.code == 'success') {
                            $state.go('serviceList');
                        }
                    });
                } else {
                    $scope.service.$save(function (resp) {
                        console.log('Response:', resp);
                        // close confirmation window
                        confirmModal.hide();

                        if (resp.code == 'success') {
                            $state.go('serviceList');
                        }
                    });
                }
            };
            // show=true by default, so this line will show our modal window
            var confirmModal = $modal({scope: $scope, templateUrl: 'partials/_modal_confirmation.html'});
        };

    });