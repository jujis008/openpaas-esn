'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The contact Angular module directives', function() {

  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('ngRoute');
    angular.mock.module('esn.core');
    angular.mock.module('linagora.esn.contact');
    angular.mock.module('esn.alphalist');
    module('jadeTemplates');
  });

  describe('inlineEditableInput', function() {

    beforeEach(inject(['$compile', '$rootScope', '$timeout', 'DEFAULT_AVATAR', function($c, $r, $t, DEFAULT_AVATAR) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.$scope = this.$rootScope.$new();
      this.$timeout = $t;
      this.DEFAULT_AVATAR = DEFAULT_AVATAR;

      this.initDirective = function(scope) {
        var html = '<inline-editable-input input-class="aClass" type="aType" placeholder="aPlaceholder" ng-model="aModel" on-blur="aBlurFunction" on-save ="aSaveFunction"/>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        return element;
      };
    }]));

    it('should have the proper template', function() {
      var html = '<inline-editable-input input-class="aClass" type="aType" placeholder="aPlaceholder" ng-model="aModel" on-blur="aBlurFunction" on-save ="aSaveFunction"/>';
      var element = this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(element.html()).to.deep.equal(
        '<div class="input-group">' +
        '<input type="aType" placeholder="aPlaceholder" ng-model="ngModel" ng-model-options="{updateOn: &quot;blur&quot;}" class="aClass">' +
        '<span ng-show="showGroupButtons" class="inline-input-edition-group-btn inline-remove-button input-group-btn ng-hide">' +
        '<button type="button" ng-click="resetInput()" class="btn btn-default">' +
        '<i class="fa fa-remove"></i>' +
        '</button>' +
        '</span>' +
        '<span ng-show="showGroupButtons" class="inline-input-edition-group-btn inline-check-button input-group-btn ng-hide">' +
        '<button type="button" class="btn btn-default">' +
        '<i class="fa fa-check"></i>' +
        '</button>' +
        '</span>' +
        '</div>');
    });

    it('should bind on focus that toggle the group buttons', function() {
      var element = this.initDirective(this.$scope);
      var input = element.find('input');
      input.appendTo(document.body);
      input.focus();
      var scope = element.isolateScope();
      this.$timeout.flush();
      expect(scope.showGroupButtons).to.be.true;
    });

    it('should bind on blur and call saveInput if old value !== new value of ng-model controller', function(done) {
      this.$scope.aModel = 'value';
      this.$scope.aSaveFunction = done;
      var element = this.initDirective(this.$scope);
      var input = element.find('input');
      input.appendTo(document.body);
      input.blur();
      this.$timeout.flush();
    });

    it('should bind on blur and do not call saveInput if old value === new value', function(done) {
      this.$scope.aModel = undefined;
      this.$scope.aSaveFunction = function() {
        done(new Error('should not be called'));
      };
      this.$scope.aBlurFunction = done;
      var element = this.initDirective(this.$scope);
      var input = element.find('input');
      input.appendTo(document.body);
      input.blur();
      this.$timeout.flush();
    });

    it('should bind on blur, toggle the group buttons and call onBlur after 200 ms', function(done) {
      var scope;
      this.$scope.aModel = 'value';
      this.$scope.aSaveFunction = function() {};
      this.$scope.aBlurFunction = function() {
        expect(scope.showGroupButtons).to.be.true;
        done();
      };
      var element = this.initDirective(this.$scope);
      var input = element.find('input');
      input.appendTo(document.body);
      input.blur();
      scope = element.isolateScope();
      this.$timeout.flush();
    });

    it('should bind on keydown and call resetInput if escape is the event', function(done) {
      var element = this.initDirective(this.$scope);
      var input = element.find('input');
      input.appendTo(document.body);
      var scope = element.isolateScope();
      scope.resetInput = done;
      var escape = $.Event('keydown');
      escape.which = 27;
      input.trigger(escape);
      this.$timeout.flush();
    });

  });

  describe('The contactPhoto directive', function() {

    var element;

    beforeEach(function() {
      element = this.$compile('<contact-photo contact="contact"></contact-photo>')(this.$scope);
    });

    it('should use the default avatar if contact.photo is not defined', function() {
      this.$scope.$digest();

      expect(element.find('img').attr('src')).to.equal(this.DEFAULT_AVATAR);
    });

    it('should use the contact photo if defined', function() {
      this.$scope.contact = {
        photo: 'data:image/png,base64;abcd='
      };
      this.$scope.$digest();

      expect(element.find('img').attr('src')).to.equal('data:image/png,base64;abcd=');
    });

  });

  describe('The editable contactPhoto directive', function() {

    var element;

    beforeEach(function() {
      element = this.$compile('<contact-photo editable="true" contact="contact"></contact-photo>')(this.$scope);
    });

    it('should display the hint', function() {
      this.$scope.$digest();

      expect(element.find('i').css('display')).to.not.equal('none');
    });

  });

  describe('The contactListItem directive', function() {

    beforeEach(function() {

      this.notificationFactory = {};
      this.contactsService = {};
      var self = this;

      angular.mock.module(function($provide) {
        $provide.value('notificationFactory', self.notificationFactory);
        $provide.value('contactsService', self.contactsService);
      });
    });

    beforeEach(angular.mock.inject(function($rootScope, $compile, $q) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
      this.$q = $q;
      this.scope = $rootScope.$new();
      this.scope.contact = {
        uid: 'myuid'
      };
      this.scope.bookId = '123';
      this.html = '<contact-list-item contact="contact" book-id="bookId"></contact-list-item>';
    }));

    describe('Setting scope values', function() {

      it('should set the first contact email and tel in scope', function(done) {
        var tel1 = '+33499998899';
        var tel2 = '+33499998800';
        var email1 = 'yo@open-paas.org';
        var email2 = 'lo@open-paas.org';

        this.scope.contact.tel = [{type: 'Home', value: tel1}, {type: 'Work', value: tel2}];
        this.scope.contact.emails = [{type: 'Home', value: email1}, {type: 'Work', value: email2}];

        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        var iscope = element.isolateScope();
        expect(iscope.tel).to.equal(tel1);
        expect(iscope.email).to.equal(email1);
        done();
      });
    });

    describe('the deleteContact function', function() {

      it('should call contactsService.remove()', function(done) {

        this.contactsService.remove = done();

        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        var iscope = element.isolateScope();
        iscope.deleteContact();
        done(new Error());
      });

      it('should call $scope.$emit when remove is ok', function(done) {
        var self = this;
        this.notificationFactory.weakInfo = function() {};

        var defer = this.$q.defer();
        defer.resolve();
        this.contactsService.remove = function() {
          return defer.promise;
        };

        this.scope.$on('contact:deleted', function(event, data) {
          expect(data).to.deep.equal(self.scope.contact);
          done();
        });

        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        var iscope = element.isolateScope();
        iscope.deleteContact();
        this.scope.$digest();

        done(new Error());
      });

      it('should display notification when on remove success', function(done) {
        this.notificationFactory.weakInfo = function() {
          done();
        };

        var defer = this.$q.defer();
        defer.resolve();
        this.contactsService.remove = function() {
          return defer.promise;
        };

        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        var iscope = element.isolateScope();
        iscope.deleteContact();
        this.scope.$digest();
        done(new Error());
      });

      it('should display error when on remove failure', function(done) {
        this.notificationFactory.weakError = function() {
          done();
        };

        var defer = this.$q.defer();
        defer.reject();
        this.contactsService.remove = function() {
          return defer.promise;
        };

        var element = this.$compile(this.html)(this.scope);
        this.scope.$digest();
        var iscope = element.isolateScope();
        iscope.deleteContact();
        this.scope.$digest();
        done(new Error());
      });
    });
  });


});
