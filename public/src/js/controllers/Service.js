angular.module('MyClinic')
    .controller('ServicesCtrl', function ($scope, Modal, Service) {
        $scope.reloadPage = function () {
            $scope.services = Service.query({light: 1});
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

        $scope.tinymceOptions = {
            //language: 'ru_RU',
            //language_url: '/assets/lib/tinymce-dist/langs/ru_RU.js',
            plugins: 'advlist autolink lists link image charmap print preview hr anchor pagebreak searchreplace wordcount visualblocks visualchars code fullscreen insertdatetime media nonbreaking save table contextmenu directionality emoticons template paste textcolor colorpicker textpattern imagetools',
            paste_data_images: true
        };

        $scope.Template = {
            add: function () {
                if (!$scope.service.templates) {
                    $scope.service.templates = [];
                }
                $scope.service.templates.push({});
            },
            remove: function (idx) {
                Modal.confirm({
                    content: 'Удалить шаблон?',
                    okAction: function (modal) {
                        modal.hide();
                        $scope.service.templates.splice(idx, 1);
                    }
                });
            },
            defaultChanged: function (tpl) {
                // if new isDefault value is ON, then turn off others values to OFF
                if (tpl.isDefault == 1) {
                    for (let t of $scope.service.templates) {
                        if (t != tpl) {
                            t.isDefault = 0;
                        }
                    }
                }
            }
        };

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
                            // close confirmation window
                            modal.hide();

                            if (resp._id) {
                                $state.go('serviceList');
                            }
                        });
                    } else {
                        $scope.service.$save(function (resp) {
                            // close confirmation window
                            modal.hide();

                            if (resp._id) {
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