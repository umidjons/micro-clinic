'use strict';

angular.module('MyClinic')
    .controller('PartnerCtrl', function ($scope, $state, $stateParams, Modal, Partner, State) {
        console.log('Params:', $stateParams);

        $scope.states = State.query();

        if ($stateParams.id) {
            Partner.get({id: $stateParams.id}, function (partner) {
                console.log('partner=', partner);
                $scope.partner = partner;
            });
        } else {
            $scope.partner = new Partner();
        }

        $scope.savePartner = function () {
            Modal.confirm({
                okAction: function (modal) {
                    if ($scope.partner._id) {
                        $scope.partner.$update(function (resp) {
                            console.log('Response:', resp);
                            // close confirmation window
                            modal.hide();

                            if (resp.code == 'success') {
                                $state.go('partnerList');
                            }
                        });
                    } else {
                        $scope.partner.$save(function (resp) {
                            console.log('Response:', resp);
                            // close confirmation window
                            modal.hide();

                            if (resp.code == 'success') {
                                $state.go('partnerList');
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