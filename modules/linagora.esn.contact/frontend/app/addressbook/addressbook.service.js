(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactAddressbookService', contactAddressbookService);

  function contactAddressbookService(
    $rootScope,
    $q,
    session,
    ContactAPIClient,
    contactAddressbookDisplayService,
    CONTACT_ADDRESSBOOK_EVENTS,
    CONTACT_ADDRESSBOOK_TYPES,
    CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL
  ) {
    return {
      createAddressbook: createAddressbook,
      getAddressbookByBookName: getAddressbookByBookName,
      listAddressbooks: listAddressbooks,
      listAddressbooksUserCanCreateContact: listAddressbooksUserCanCreateContact,
      removeAddressbook: removeAddressbook,
      updateAddressbook: updateAddressbook,
      listSubscribableAddressbooks: listSubscribableAddressbooks,
      listSubscribedAddressbooks: listSubscribedAddressbooks,
      subscribeAddressbooks: subscribeAddressbooks,
      updateAddressbookPublicRight: updateAddressbookPublicRight
    };

    function getAddressbookByBookName(bookName) {
      return ContactAPIClient.addressbookHome(session.user._id).addressbook(bookName).get();
    }

    function listAddressbooks() {
      return ContactAPIClient.addressbookHome(session.user._id).addressbook().list();
    }

    function listAddressbooksUserCanCreateContact() {
      return listAddressbooks().then(function(addressbooks) {
        return addressbooks.filter(function(addressbook) {
          return addressbook.canCreateContact;
        });
      });
    }

    function createAddressbook(addressbook) {
      if (!addressbook) {
        return $q.reject(new Error('Address book is required'));
      }

      if (!addressbook.name) {
        return $q.reject(new Error('Address book\'s name is required'));
      }

      addressbook.type = CONTACT_ADDRESSBOOK_TYPES.user;

      return ContactAPIClient
        .addressbookHome(session.user._id)
        .addressbook()
        .create(addressbook)
        .then(function(createdAddressbook) {
          $rootScope.$broadcast(
            CONTACT_ADDRESSBOOK_EVENTS.CREATED,
            createdAddressbook
          );
        });
    }

    function removeAddressbook(addressbook) {
      return ContactAPIClient
        .addressbookHome(session.user._id)
        .addressbook(addressbook.bookName)
        .remove()
        .then(function() {
          $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.DELETED, addressbook);
        });
    }

    function updateAddressbook(addressbook) {
      return ContactAPIClient
        .addressbookHome(session.user._id)
        .addressbook(addressbook.bookName)
        .update(addressbook)
        .then(function() {
          $rootScope.$broadcast(CONTACT_ADDRESSBOOK_EVENTS.UPDATED, addressbook);
        });
    }

    function listSubscribableAddressbooks(userId) {
      return ContactAPIClient.addressbookHome(userId).addressbook().list({ public: true });
    }

    function listSubscribedAddressbooks() {
      return ContactAPIClient.addressbookHome(session.user._id).addressbook().list({ subscribed: true });
    }

    function subscribeAddressbooks(addressbookShells) {
      return $q.all(addressbookShells.map(function(addressbookShell) {
        var formattedSubscriptions = {
          description: addressbookShell.description,
          name: contactAddressbookDisplayService.buildDisplayName(addressbookShell),
          type: CONTACT_ADDRESSBOOK_TYPES.subscription,
          'openpaas:source': {
            _links: {
              self: {
                href: addressbookShell.href
              }
            }
          }
        };

        return ContactAPIClient
          .addressbookHome(session.user._id)
          .addressbook()
          .create(formattedSubscriptions)
          .then(function(createdAddressbook) {
            $rootScope.$broadcast(
              CONTACT_ADDRESSBOOK_EVENTS.CREATED,
              createdAddressbook
            );
          });
      }));
    }

    function updateAddressbookPublicRight(addressbook, publicRight) {
      var formatedPublicRight = publicRight ? [
        {
          principal: CONTACT_ADDRESSBOOK_AUTHENTICATED_PRINCIPAL,
          privilege: publicRight
        }
      ] : [];

      return ContactAPIClient
        .addressbookHome(session.user._id)
        .addressbook(addressbook.bookName)
        .updatePublicRight(formatedPublicRight);
    }
  }
})(angular);
