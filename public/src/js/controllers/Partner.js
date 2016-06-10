(function () {
    'use strict';

    angular.module('MyClinic')
        .controller('PartnerCtrl', function ($scope, $state, $stateParams, Modal, Partner, State, Setting) {
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
                            $scope.partner.$update(function (resp) {
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
                            $scope.partner.$save(function (resp) {
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
        .controller('PartnersCtrl', function ($scope, Modal, Partner) {
            $scope.reloadPage = function () {
                $scope.partners = Partner.query();
            };

            $scope.deletePartner = function (partner) {
                Modal.confirm({
                    content: 'Удалить партнёра?',
                    okAction: function (modal) {
                        if (partner) {
                            partner.$delete(function (resp) {
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
        .controller('PartnerInterestCtrl', function ($scope, Partner) {
            $scope.period = {
                start: Date.create('the beginning of this month'),
                end: Date.create('the end of this month')
            };

            $scope.refresh = function () {
                $scope.records = Partner.interests({period: $scope.period});
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