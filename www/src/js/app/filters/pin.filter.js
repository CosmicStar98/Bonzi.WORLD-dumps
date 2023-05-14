(function () {
  'use strict';
  angular.module('app.filters')
    .filter('pinUser', PinUserFilter);
  function PinUserFilter() {
    return function (list, pinLabel) {
      var returnArray = [];
      var everyoneElseArray = [];
      for (var i = 0; i < list.length; i++) {
        if (list[i].label === pinLabel) {
          returnArray.push(list[i]);
        } else {
          everyoneElseArray.push(list[i]);
        }
      }
      return returnArray.concat(everyoneElseArray);
    };
  }
})();
