(function () {
    'use strict';

    angular.module('MyClinic')
        .controller('ServicesCtrl', function ($scope, Modal, Service, State, ServiceCategory, Pager, Auth) {
            $scope.pagination = Pager.new();
            $scope.pagination.pageSize = 20;
            $scope.states = State.query();
            $scope.categories = ServiceCategory.query();

            $scope.filter = {
                category: undefined,
                subcategory: undefined,
                subsubcategory: undefined,
                title: undefined,
                price: undefined,
                state: undefined,
                reset: function () {
                    this.category = undefined;
                    this.subcategory = undefined;
                    this.subsubcategory = undefined;
                    this.title = undefined;
                    this.price = undefined;
                    this.state = undefined;
                },
                onChange: function () {
                    if (angular.isDefined(this.category) && !this.category.title) {
                        this.category = undefined;
                    }
                    if (angular.isDefined(this.subcategory) && !this.subcategory.title) {
                        this.subcategory = undefined;
                    }
                    if (angular.isDefined(this.subsubcategory) && !this.subsubcategory.title) {
                        this.subsubcategory = undefined;
                    }
                },
                by: function (category, level) {
                    switch (level) {
                        case 'category':
                            if (angular.isDefined(category)) {
                                this.category = {title: category.title};
                                if (angular.isDefined(category.subcategories) && category.subcategories.length > 0) {
                                    $scope.subcategories = category.subcategories;
                                } else {
                                    $scope.subcategories = [];
                                }
                                this.subcategory = undefined;
                                this.subsubcategory = undefined;
                            } else {
                                this.category = undefined;
                                this.subcategory = undefined;
                                this.subsubcategory = undefined;
                                $scope.subcategories = [];
                            }
                            break;
                        case 'subcategory':
                            if (angular.isDefined(category)) {
                                this.subcategory = {title: category.title};
                                if (angular.isDefined(category.subcategories) && category.subcategories.length > 0) {
                                    $scope.subsubcategories = category.subcategories;
                                } else {
                                    $scope.subsubcategories = [];
                                }
                            } else {
                                this.subcategory = undefined;
                                $scope.subsubcategories = [];
                            }
                            this.subsubcategory = undefined;
                            break;
                        case 'subsubcategory':
                            if (angular.isDefined(category)) {
                                this.subsubcategory = {title: category.title};
                            } else {
                                this.subsubcategory = undefined;
                            }
                            break;
                    }
                }
            };

            $scope.reloadPage = function () {
                $scope.services = Service.query({light: 1});
            };

            $scope.deleteService = function (service) {
                if (!Auth.hasAccess('service:delete')) {
                    return;
                }

                Modal.confirm({
                    content: 'Удалить услугу?',
                    okAction: function (modal) {
                        if (service) {
                            Service.delete({}, {_id: service._id}, function (resp) {
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
                                             Modal, State, ServiceCategory, Service, FieldType, hotkeys, Auth) {
            $scope.serviceCategories = ServiceCategory.query();
            $scope.states = State.query();
            $scope.tab = {name: 'templates'};

            $scope.tinymceOptions = {
                //language: 'ru_RU',
                //language_url: '/assets/lib/tinymce-dist/langs/ru_RU.js',
                plugins: 'advlist autolink lists link image charmap print preview hr anchor pagebreak searchreplace wordcount visualblocks visualchars code fullscreen insertdatetime media nonbreaking save table contextmenu directionality emoticons template paste textcolor colorpicker textpattern imagetools',
                paste_data_images: true,
                height: 500
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
                            if (!Auth.hasAccess('service:edit'))
                                return;

                            Service.update($scope.service, function (resp) {
                                // close confirmation window
                                modal.hide();

                                if (resp._id) {
                                    $state.go('serviceEdit', {id: resp._id});
                                }
                            });
                        } else {
                            if (!Auth.hasAccess('service:create'))
                                return;

                            Service.save($scope.service, function (resp) {
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

            hotkeys.bindTo($scope)
                .add({
                    combo: 'alt+s',
                    description: 'Сохранить',
                    callback: $scope.saveService
                });

            $scope.cloneService = function () {
                if (!Auth.hasAccess('service:create'))
                    return;

                Modal.confirm({
                    okAction: function (modal) {
                        if ($scope.service._id) {
                            Service.clone($scope.service, function (resp) {
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
})();