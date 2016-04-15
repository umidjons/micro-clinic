angular.module('MyClinic')
    .factory('Msg', function (toaster) {
        return {
            info: function (msg) {
                toaster.pop('info', '', msg);
            },
            success: function (msg) {
                toaster.pop('success', '', msg);
            },
            warning: function (msg) {
                toaster.pop('warning', '', msg);
            },
            error: function (msg) {
                toaster.pop('error', '', msg);
            }
        }
    })
    .service('Sex', function () {
        this.query = function () {
            return [
                {_id: 'male', title: 'Мужчина'},
                {_id: 'female', title: 'Женщина'}
            ];
        }
    })
    .service('State', function () {
        this.query = function () {
            return [
                {_id: 'active', title: 'Активный'},
                {_id: 'blocked', title: 'Заблокирован'}
            ];
        }
    })
    .factory('Patient', function ($resource) {
        return $resource(
            '/patient/:id', // URL to patient backend API
            {id: '@_id'}, // obtain id from _id field of patient object
            {
                update: {
                    method: 'PUT' // for .update() method use PUT request
                },
                search: {
                    method: 'POST', url: '/patient/search', isArray: true
                }
            }
        );
    })
    .factory('ServiceCategory', function ($resource) {
        return $resource(
            '/service-category/:id',
            {id: '@_id'},
            {
                update: {
                    method: 'PUT'
                },
                categoriesWithServices: {
                    method: 'GET', url: '/service-category/with-services', isArray: true
                }
            }
        );
    })
    .factory('Service', function ($resource) {
        var res = $resource(
            '/service/:id',
            {id: '@_id'},
            {
                update: {
                    method: 'PUT'
                },
                servicesWithCategory: {
                    method: 'GET', url: '/service/with-category', isArray: true
                }
            }
        );

        res.recalc = function (srv) {
            srv.priceTotal = srv.quantity * srv.price;
            if (srv.discount && srv.discount.amount > 0) {
                srv.priceTotal -= srv.priceTotal * 0.01 * srv.discount.amount;
            }
        };

        return res;
    })
    .factory('Partner', function ($resource) {
        return $resource(
            '/partner/:id',
            {id: '@_id'},
            {
                update: {
                    method: 'PUT'
                }
            }
        );
    })
    .factory('PatientService', function ($resource) {
        return $resource(
            '/patient-service/:id',
            {id: '@_id'},
            {
                update: {
                    method: 'PUT'
                },
                forPatient: {
                    method: 'GET', url: '/patient-service/for/:patientId', isArray: true
                }
            }
        );
    })
    .factory('PartnerSetter', function ($aside, $rootScope, Partner) {
        var PartnerSetter = {
            partners: [],
            partner: undefined,
            aside: null,
            scope: null,
            // fnCheckedServices() - return selected services,
            // fnCheckedServices(true) - return count of selected services
            fnSelectedServices: null
        };

        // retrieve partners
        PartnerSetter.partners = Partner.query();

        PartnerSetter.open = function (fnSelectedServices) {
            // create new scope
            this.scope = $rootScope.$new(true);

            // do available PartnerSetter on the template
            this.scope.PartnerSetter = PartnerSetter;

            this.fnSelectedServices = fnSelectedServices;

            // get selected services count
            this.selServiceCount = this.fnSelectedServices(true);

            // if only one service selected, then show its partner on aside
            // otherwise show aside without partner selected
            if (this.selServiceCount == 1) {
                var firstSrv = this.fnSelectedServices()[0];
                if ('partner' in firstSrv) {
                    this.partner = firstSrv.partner;
                }
            } else {
                this.partner = undefined;
            }

            // create and show aside, also keep it in a property
            this.aside = $aside({
                scope: this.scope,
                templateUrl: 'partials/patient/_aside_partner.html',
                title: 'Партнёр',
                container: 'body',
                backdrop: 'static',
                show: true
            });
        };

        PartnerSetter.set = function () {
            var srvList = this.fnSelectedServices();
            for (let srv of srvList) {
                srv.partner = this.partner;
            }
            this.aside.hide();
        };

        PartnerSetter.reset = function () {
            var srvList = this.fnSelectedServices();
            for (let srv of srvList) {
                srv.partner = undefined;
            }
            this.aside.hide();
        };

        PartnerSetter.resetModel = function () {
            this.partner = undefined;
        };

        PartnerSetter.allow = function () {
            return this.selServiceCount > 0;
        };

        return PartnerSetter;
    })
    .factory('Discount', function ($aside, $rootScope) {
        var Discount = {
            amount: 0,
            note: '',
            aside: null,
            scope: null,
            fnRecalcService: null, // function to re-calculate service parameters (price, discount...)
            // fnCheckedServices() - return selected services,
            // fnCheckedServices(true) - return count of selected services
            fnSelectedServices: null
        };

        /**
         * Set discount to selected services.
         */
        Discount.set = function () {
            var srvList = this.fnSelectedServices();
            srvList.forEach(function (srv) {
                if (Discount.amount == 0) {
                    delete srv.discount;
                } else {
                    // create discount object in the service, if it doesn't exist
                    srv.discount = srv.discount || {};

                    // set amount and note
                    srv.discount.amount = Discount.amount;
                    srv.discount.note = Discount.note;
                }

                // re-calculate properties
                Discount.fnRecalcService(srv);
            });

            // close aside
            this.aside.hide();
        };

        /**
         * Reset discount for selected services.
         */
        Discount.reset = function () {
            // reset properties
            this.amount = 0;
            this.note = '';

            // re-set discount object for all selected services
            this.set();
        };

        Discount.open = function (fnRecalcService, fnSelectedServices) {
            // create new scope
            this.scope = $rootScope.$new(true);

            // do available Discount on the template
            this.scope.Discount = Discount;

            // keep important objects in properties
            this.fnRecalcService = fnRecalcService;

            // without parameter should return selected services
            // with truth parameter should return count of selected services
            this.fnSelectedServices = fnSelectedServices;

            // get selected services count
            this.selServiceCount = this.fnSelectedServices(true);

            // if only one service selected, then show its discount parameters on aside
            // otherwise show aside with initial values
            if (this.selServiceCount == 1) {
                var firstSrv = this.fnSelectedServices()[0];
                if (firstSrv.discount && 'amount' in firstSrv.discount) {
                    this.amount = firstSrv.discount.amount;
                    this.note = firstSrv.discount.note;
                } else {
                    this.amount = 0;
                    this.note = '';
                }
            } else {
                this.amount = 0;
                this.note = '';
            }

            // create and show aside, also keep it in a property
            this.aside = $aside({
                scope: this.scope,
                templateUrl: 'partials/patient/_aside_discount.html',
                title: 'Скидка',
                container: 'body',
                backdrop: 'static',
                show: true
            });
        };

        Discount.allow = function () {
            return this.selServiceCount > 0;
        };


        return Discount;
    })
    .factory('Modal', function ($modal, $rootScope) {
        var Modal = {};

        Modal.confirm = function (options) {
            // default options
            var defaults = {
                title: 'Подтверждение',
                content: 'Сохранить изменения?',
                okAction: function (modal) {
                    // close confirmation window
                    modal.hide();
                }
            };

            // merge options
            var opts = angular.extend({}, defaults, options);

            // create and fill scope
            var scope = $rootScope.$new();
            scope.title = opts.title;
            scope.content = opts.content;
            scope.okAction = opts.okAction;

            // OK button handler
            scope.ok = function () {
                // call okAction with current modal instance
                scope.okAction(confirmModal);
            };

            // show=true by default, so this line will show our modal window
            var confirmModal = $modal({scope: scope, templateUrl: 'partials/_modal_confirmation.html'});
        };

        return Modal;
    });