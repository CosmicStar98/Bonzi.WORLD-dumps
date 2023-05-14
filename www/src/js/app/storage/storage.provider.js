(function (angular) {
  'use strict';

  // In cases where Angular does not get passed or angular is a truthy value
  // but misses .module we can fall back to using window.
  angular = (angular && angular.module) ? angular : window.angular;

  function isStorageSupported($window, storageType) {
    // Some installations of IE, for an unknown reason, throw "SCRIPT5: Error: Access is denied"
    // when accessing window.localStorage. This happens before you try to do anything with it. Catch
    // that error and allow execution to continue.

    // fix 'SecurityError: DOM Exception 18' exception in Desktop Safari, Mobile Safari
    // when "Block cookies": "Always block" is turned on
    var supported;
    try {
      supported = $window[storageType];
    } catch (err) {
      supported = false;
    }

    // When Safari (OS X or iOS) is in private browsing mode, it appears as though localStorage and sessionStorage
    // is available, but trying to call .setItem throws an exception below:
    // "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to add something to storage that exceeded the quota."
    if (supported) {
      var key = '__' + Math.round(Math.random() * 1e7);
      try {
        $window[storageType].setItem(key, key);
        $window[storageType].removeItem(key, key);
      } catch (err) {
        supported = false;
      }
    }
    return supported;
  }

  /**
   * @ngdoc overview
   * @name ngStorage
   */

  return angular.module('app.storage', [])

  /**
   * @ngdoc object
   * @name ngStorage.$localStorage
   * @requires $rootScope
   * @requires $window
   */

    .provider('$localStorage', _storageProvider('localStorage'))

  /**
   * @ngdoc object
   * @name ngStorage.$sessionStorage
   * @requires $rootScope
   * @requires $window
   */

    .provider('$sessionStorage', _storageProvider('sessionStorage'));

  function _storageProvider(storageType) {
    var providerWebStorage = isStorageSupported(window, storageType);

    return function () {
      var self = this;
      var storageKeyPrefix = 'ngStorage-';

      self.setKeyPrefix = function (prefix) {
        if (typeof prefix !== 'string') {
          throw new TypeError('[ngStorage] - ' + storageType + 'Provider.setKeyPrefix() expects a String.');
        }
        storageKeyPrefix = prefix;
      };

      var serializer = angular.toJson;
      var deserializer = angular.fromJson;

      self.setSerializer = function (s) {
        if (typeof s !== 'function') {
          throw new TypeError('[ngStorage] - ' + storageType + 'Provider.setSerializer expects a function.');
        }

        serializer = s;
      };

      self.setDeserializer = function (d) {
        if (typeof d !== 'function') {
          throw new TypeError('[ngStorage] - ' + storageType + 'Provider.setDeserializer expects a function.');
        }

        deserializer = d;
      };

      self.supported = function () {
        return Boolean(providerWebStorage);
      };

      // Note: Self/This is not very elegant at all.
      self.get = function (key) {
        return providerWebStorage && deserializer(providerWebStorage.getItem(storageKeyPrefix + key));
      };

      // Note: Self/This is not very elegant at all.
      self.set = function (key, value) {
        return providerWebStorage && providerWebStorage.setItem(storageKeyPrefix + key, serializer(value));
      };

      self.remove = function (key) {
        if (providerWebStorage) {
          providerWebStorage.removeItem(storageKeyPrefix + key);
        }
      };

      self.$get = [
        '$rootScope',
        '$window',
        '$log',
        '$timeout',
        '$document',

        function (
          $rootScope,
          $window,
          $log,
          $timeout,
          $document
        ) {
          // The magic number 10 is used which only works for some keyPrefixes...
          // See https://github.com/gsklee/ngStorage/issues/137
          var prefixLength = storageKeyPrefix.length;

          // #9: Assign a placeholder object if Web Storage is unavailable to prevent breaking the entire AngularJS app
          // Note: recheck mainly for testing (so we can use $window[storageType] rather than window[storageType])
          var _last$storage;
          var _debounce;
          var isSupported = isStorageSupported($window, storageType);
          var webStorage = isSupported || ($log.warn('This browser does not support Web Storage!'), {setItem: angular.noop, getItem: angular.noop, removeItem: angular.noop});
          var $storage = {
            $default: storageDefault,
            $reset: storageReset,
            $sync: storageSync,
            $apply: storageApply,
            $supported: storageSupported
          };

          $storage.$sync();

          _last$storage = angular.copy($storage);
          // #6: Use `$window.addEventListener` instead of `angular.element` to avoid the jQuery-specific `event.originalEvent`
          if ($window.addEventListener) {
            $window.addEventListener('storage', storageListener);
            $window.addEventListener('beforeunload', beforeUnloadHandler);
          }
          $rootScope.$watch(rsWatchHandler);
          function storageDefault(items) {
            for (var k in items) {
              if (Object.prototype.hasOwnProperty.call(items, k) && !angular.isDefined($storage[k])) {
                $storage[k] = angular.copy(items[k]);
              }
            }
            $storage.$sync();
            return $storage;
          }
          function storageReset(items) {
            for (var k in $storage) {
              if (Object.prototype.hasOwnProperty.call($storage, k) && k[0] !== '$') {
                delete $storage[k];
                webStorage.removeItem(storageKeyPrefix + k);
              }
            }
            return $storage.$default(items);
          }
          function storageSync() {
            var k;
            var l = webStorage.length;
            for (var i = 0; i < l; i++) {
              // #8, #10: `webStorage.key(i)` may be an empty string (or throw an exception in IE9 if `webStorage` is empty)
              // (k = webStorage.key(i)) && storageKeyPrefix === k.slice(0, prefixLength) && ($storage[k.slice(prefixLength)] = deserializer(webStorage.getItem(k)));
              k = webStorage.key(i);
              if (storageKeyPrefix === k.slice(0, prefixLength)) {
                $storage[k.slice(prefixLength)] = deserializer(webStorage.getItem(k));
              }
            }
          }
          function storageApply() {
            var temp$storage;
            _debounce = null;

            if (!angular.equals($storage, _last$storage)) {
              temp$storage = angular.copy(_last$storage);
              angular.forEach($storage, function (v, k) {
                if (angular.isDefined(v) && k[0] !== '$') {
                  webStorage.setItem(storageKeyPrefix + k, serializer(v));
                  delete temp$storage[k];
                }
              });

              for (var k in temp$storage) {
                if (Object.prototype.hasOwnProperty.call(temp$storage, k)) {
                  webStorage.removeItem(storageKeyPrefix + k);
                }
              }

              _last$storage = angular.copy($storage);
            }
          }
          function storageSupported() {
            return Boolean(isSupported);
          }
          function rsWatchHandler() {
            if (!_debounce) {
              _debounce = $timeout($storage.$apply, 100, false);
            }
          }
          function storageListener(event) {
            if (!event.key) {
              return;
            }
            // Reference doc.
            var doc = $document[0];
            if ((!doc.hasFocus || !doc.hasFocus()) && storageKeyPrefix === event.key.slice(0, prefixLength)) {
              if (event.newValue) {
                $storage[event.key.slice(prefixLength)] = deserializer(event.newValue);
              } else {
                delete $storage[event.key.slice(prefixLength)];
              }
              _last$storage = angular.copy($storage);
              $rootScope.$apply();
            }
          }
          function beforeUnloadHandler() {
            $storage.$apply();
          }
          return $storage;
        }
      ];
    };
  }
})(angular);
