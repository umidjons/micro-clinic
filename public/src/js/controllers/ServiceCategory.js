angular.module('MyClinic')
    .controller('ServiceCategoryListCtrl', function ($scope, Modal, ServiceCategory) {
        $scope.reloadPage = function () {
            $scope.categories = ServiceCategory.query();
        };

        $scope.deleteCategory = function (category) {
            Modal.confirm({
                content: 'Удалить категорию?',
                okAction: function (modal) {
                    if (category) {
                        category.$delete(function (resp) {
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
    .controller('ServiceCategoryCtrl', function ($scope, $state, $stateParams, Modal, State, ServiceCategory) {
        $scope.states = State.query();

        if ($stateParams.id) {
            ServiceCategory.get({id: $stateParams.id}, function (category) {
                $scope.category = category;
            });
        } else {
            $scope.category = new ServiceCategory();
            $scope.category.isNew = 1;
        }

        $scope.saveCategory = function () {
            Modal.confirm({
                okAction: function (modal) {
                    if ($scope.category._id && !$scope.category.isNew) {
                        $scope.category.$update(function (resp) {
                            // close confirmation window
                            modal.hide();

                            if (resp._id) {
                                $state.go('serviceCategoryList');
                            }
                        });
                    } else {
                        $scope.category.$save(function (resp) {
                            // close confirmation window
                            modal.hide();

                            if (resp._id) {
                                $state.go('serviceCategoryList');
                            }
                        });
                    }
                }
            });
        };

    });