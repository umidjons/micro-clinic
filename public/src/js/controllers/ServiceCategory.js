(function () {
    'use strict';
    angular.module('MyClinic')
        .controller('ServiceCategoryListCtrl', function ($scope, Modal, ServiceCategory, Auth) {
            $scope.reloadPage = function () {
                $scope.categories = ServiceCategory.query();
            };

            $scope.deleteCategory = function (category) {
                if (!Auth.hasAccess('category:delete')) {
                    return;
                }

                Modal.confirm({
                    content: 'Удалить категорию?',
                    okAction: function (modal) {
                        if (category) {
                            ServiceCategory.delete({}, {_id: category._id}, function (resp) {
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
        .controller('ServiceCategoryCtrl', function ($scope, $state, $stateParams, Modal, State,
                                                     ServiceCategory, Auth) {
            $scope.states = State.query();

            $scope.SubCat = {
                add: function () {
                    if (!$scope.category.subcategories) {
                        $scope.category.subcategories = [];
                    }
                    $scope.category.subcategories.push({});
                },
                remove: function (idx) {
                    Modal.confirm({
                        content: 'Удалить подкатегорию?',
                        okAction: function (modal) {
                            modal.hide();
                            $scope.category.subcategories.splice(idx, 1);
                        }
                    });
                }
            };

            $scope.SubSubCat = {
                add: function (subCat) {
                    if (!subCat.subcategories) {
                        subCat.subcategories = [];
                    }
                    subCat.subcategories.push({});
                },
                remove: function (subCat, idx) {
                    Modal.confirm({
                        content: 'Удалить под-подкатегорию?',
                        okAction: function (modal) {
                            modal.hide();
                            subCat.subcategories.splice(idx, 1);
                        }
                    });
                }
            };

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
                            if (!Auth.hasAccess('category:edit')) {
                                return;
                            }

                            ServiceCategory.update($scope.category, function (resp) {
                                // close confirmation window
                                modal.hide();

                                if (resp._id) {
                                    $state.transitionTo('serviceCategoryEdit', $stateParams, {
                                        reload: true,
                                        inherit: false,
                                        notify: true
                                    });
                                }
                            });
                        } else {
                            if (!Auth.hasAccess('category:create')) {
                                return;
                            }

                            ServiceCategory.save($scope.category, function (resp) {
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
})();