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
        });
})();