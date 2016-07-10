(function () {
    'use strict';

    angular.module('MyClinic')
        .controller('DiscountReasonListCtrl', function ($scope, Modal, DiscountReason, Auth) {

            $scope.reloadPage = function () {
                $scope.discountReasons = DiscountReason.query();
            };

            $scope.reloadPage();

            $scope.createReason = function () {
                $scope.discountReasons.push({text: ''});
            };

            $scope.deleteReason = function (reason, idx) {
                if (reason._id) {
                    if (!Auth.hasAccess('cash:discount:reason:delete')) {
                        return;
                    }

                    Modal.confirm({
                        content: 'Удалить запись?',
                        okAction: function (modal) {
                            DiscountReason.delete({}, {_id: reason._id}, function (resp) {
                                // close confirmation window
                                modal.hide();

                                if (resp.code == 'success') {
                                    $scope.reloadPage();
                                }
                            });
                        }
                    });
                } else {
                    $scope.discountReasons.splice(idx, 1);
                }
            };

            $scope.saveReason = function (reason) {
                Modal.confirm({
                    okAction: function (modal) {
                        if (reason._id) {
                            if (!Auth.hasAccess('cash:discount:reason:edit')) {
                                return;
                            }

                            DiscountReason.update(reason, function (resp) {
                                // close confirmation window
                                modal.hide();

                                if (resp.code == 'success') {
                                    $scope.reloadPage();
                                }
                            });
                        } else {
                            if (!Auth.hasAccess('cash:discount:reason:create')) {
                                return;
                            }

                            DiscountReason.save(reason, function (resp) {
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

        });
})();