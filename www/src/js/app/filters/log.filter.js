(function () {
  'use strict';
  angular.module('app.filters')
    .filter('htmlToPlaintext', HTMLToPlainText);

  HTMLToPlainText.$inject = [];
  function HTMLToPlainText() {
    return function(text, nf) {
      if (nf) {
        return text;
      }

      return text ? String(text).replace(/<[^>]+>/gm, '') : '';
    };
  }
})();
