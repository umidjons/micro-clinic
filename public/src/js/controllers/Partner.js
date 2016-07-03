(function () {
    'use strict';

    angular.module('MyClinic')
        .controller('PartnerCtrl', function ($scope, $state, $stateParams, Modal, Partner, State, Setting, Auth) {
            $scope.states = State.query();

            if ($stateParams.id) {
                Partner.get({id: $stateParams.id}, function (partner) {
                    $scope.partner = partner;
                });
            } else {
                $scope.partner = new Partner();
                Partner.getNextCode(function (newCode) {
                    $scope.partner.code = newCode;
                });
            }

            $scope.savePartner = function () {
                Modal.confirm({
                    okAction: function (modal) {
                        if ($scope.partner._id) {
                            if (!Auth.hasAccess('partner:edit'))
                                return;

                            Partner.update($scope.partner, function (resp) {
                                // close confirmation window
                                modal.hide();

                                if (resp.code == 'success') {
                                    $state.transitionTo('partnerEdit', $stateParams, {
                                        reload: true,
                                        inherit: false,
                                        notify: true
                                    });
                                }
                            });
                        } else {
                            if (!Auth.hasAccess('partner:create'))
                                return;

                            Partner.save($scope.partner, function (resp) {
                                // close confirmation window
                                modal.hide();
                                if (resp.partnerId) {
                                    $state.go('partnerEdit', {id: resp.partnerId});
                                }
                            });
                        }
                    }
                });
            };

        })
        .controller('PartnersCtrl', function ($scope, Modal, Partner, Auth) {
            $scope.reloadPage = function () {
                $scope.partners = Partner.query();
            };

            $scope.deletePartner = function (partner) {
                if (!Auth.hasAccess('partner:delete'))
                    return;

                Modal.confirm({
                    content: 'Удалить партнёра?',
                    okAction: function (modal) {
                        if (partner) {
                            Partner.delete({}, {_id: partner._id}, function (resp) {
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
        .controller('PartnerViewCtrl', function ($scope, $state, $stateParams, Partner) {
            Partner.get({id: $stateParams.id}, function (partner) {
                $scope.partner = partner;
            });
        })
        .controller('PartnerInterestCtrl', function ($scope, $stateParams, Partner) {
            $scope.period = {
                start: Date.create('the beginning of this month'),
                end: Date.create('the end of this month')
            };

            $scope.refresh = function () {
                let params = {period: $scope.period};
                if ($stateParams.id) {
                    params.partnerId = $stateParams.id;
                }
                $scope.records = Partner.interests(params);
            };

            $scope.resetSearch = function () {
                $scope.sort = {by: undefined, reverse: false};
                $scope.search = {};
            };

            $scope.changeSort = function (columnName) {
                if (angular.isUndefined($scope.sort)) {
                    $scope.sort = {by: undefined, reverse: false};
                }
                $scope.sort.by = columnName;
                $scope.sort.reverse = !$scope.sort.reverse;
            };

            $scope.classSort = function (columnName) {
                if (!$scope.sort) return '';
                var class_ = $scope.sort.by == columnName;
                if (!class_) return '';
                return !$scope.sort.reverse ? 'fa-caret-up' : 'fa-caret-down';
            };

            $scope.details = function (rec) {
                if (angular.isUndefined(rec.details)) {
                    Partner.interestDetails({partner: rec.partnerCode, period: $scope.period}, function (resp) {
                        rec.details = resp;
                    });
                }
                rec.detailsOpened = !rec.detailsOpened;
            };

            $scope.refresh();
        });
})();