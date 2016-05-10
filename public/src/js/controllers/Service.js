'use strict';

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
    .controller('ServiceCtrl', function ($scope, $state, $stateParams,
                                         Modal, State, ServiceCategory, Service, FieldType) {
        $scope.serviceCategories = ServiceCategory.query();
        $scope.states = State.query();

        $scope.tinymceOptions = {
            //language: 'ru_RU',
            //language_url: '/assets/lib/tinymce-dist/langs/ru_RU.js',
            plugins: 'advlist autolink lists link image charmap print preview hr anchor pagebreak searchreplace wordcount visualblocks visualchars code fullscreen insertdatetime media nonbreaking save table contextmenu directionality emoticons template paste textcolor colorpicker textpattern imagetools',
            paste_data_images: true
        };

        $scope.Category = {
            hasSub: function (category) {
                return this.sub(category).length > 0;
            },
            sub: function (category) {
                if (!category) {
                    return [];
                }
                var cat = _.find($scope.serviceCategories, {_id: category._id});
                if (cat && cat.subcategories && cat.subcategories.length > 0) {
                    return cat.subcategories;
                }
                return [];
            },
            hasSubSub: function (category, subcategory) {
                return this.subSub(category, subcategory).length > 0;
            },
            subSub: function (category, subcategory) {
                if (!category || !subcategory) {
                    return [];
                }
                var subcats = this.sub(category);
                if (!subcats) {
                    return [];
                }
                var subcat = _.find(subcats, {_id: subcategory._id});
                if (subcat && subcat.subcategories && subcat.subcategories.length > 0) {
                    return subcat.subcategories;
                }
                return [];
            }
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

        //todo: move Fields.types into own service
        //todo: check value uniqueness in field.values
        $scope.Fields = {
            types: FieldType.query(),
            typeChanged: function (field) {
                if (field.type._id == 'select') {
                    field.values = [{text: ''}, {text: ''}];
                }
            },
            Values: {
                add: function (field, idx) {
                    field.values.splice(idx + 1, 0, {text: ''});
                },
                remove: function (field, idx) {
                    field.values.splice(idx, 1);
                }
            },
            add: function () {
                if (!$scope.service.fields) {
                    $scope.service.fields = [];
                }
                $scope.service.fields.push({});
            },
            remove: function (idx) {
                Modal.confirm({
                    content: 'Удалить поле?',
                    okAction: function (modal) {
                        modal.hide();
                        $scope.service.fields.splice(idx, 1);
                    }
                });
            }
        };

        $scope.ResFields = {
            add: function () {
                if (!$scope.service.resultFields) {
                    $scope.service.resultFields = [];
                }
                $scope.service.resultFields.push({});
            },
            remove: function (idx) {
                Modal.confirm({
                    content: 'Удалить поле?',
                    okAction: function (modal) {
                        modal.hide();
                        $scope.service.resultFields.splice(idx, 1);
                    }
                });
            }
        };

        if ($stateParams.id) {
            Service.get({id: $stateParams.id}, function (service) {
                $scope.service = service;
            });
        } else {
            $scope.service = new Service();
        }

        $scope.canSave = function () {
            var form = $scope.formService;
            // if form is valid, user can save service
            if (form.$valid) {
                return true;
            }

            // check, whether only preview forms are invalid, if so, let a user save the service
            let can = true;
            for (let key in form.$error) {
                let err = form.$error[key]; // for ex: required: [{<some err obj>},...]
                // Preview forms are nested, so check $error is array?
                // Also note, service forms contains nested forms, therefore even plain fields generates
                // errors as array item.
                if (Array.isArray(err)) {
                    for (let errItem of err) {
                        if (errItem.$name != 'formPreview' && errItem.$name != 'formResPreview') {
                            // something else from preview forms is invalid, can't save service now
                            can = false;
                        }
                    }
                }
            }

            return can;
        };

        $scope.saveService = function () {
            Modal.confirm({
                okAction: function (modal) {
                    if ($scope.service._id) {
                        $scope.service.$update(function (resp) {
                            // close confirmation window
                            modal.hide();

                            if (resp._id) {
                                $state.go('serviceEdit', {id: resp._id});
                            }
                        });
                    } else {
                        $scope.service.$save(function (resp) {
                            // close confirmation window
                            modal.hide();

                            if (resp._id) {
                                $state.go('serviceEdit', {id: resp._id});
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