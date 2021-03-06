
/* Services */
(function(services){
  services.factory('socket', function ($rootScope, $location) {
    'use strict';
    var socket;
    var registeredEvents = [];

    if(!socket){
      socket = io.connect('http://'+$location.host()+':5000');
    }

    var sanatizeEvent = function(newEvent, newCallback){
      registeredEvents.forEach(function(registeredEvent){
        if(registeredEvent.eventName == newEvent){
          socket.removeListener(registeredEvent.eventName, registeredEvent.callback);
        }
      });
      registeredEvents.push({
        eventName: newEvent,
        callback: newCallback
      });
    };

    var registeredOn = function (eventName, callback) {
      var proxyFunction = function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      };
      sanatizeEvent(eventName, proxyFunction);
      socket.on(eventName, proxyFunction);
    };

    var emitWrapper = function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
            var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                }
            });
      });
    };

    return {
        on: registeredOn,
        emit: emitWrapper
    };
  });

  services.factory('mtgDetails', function (){
    return {
      capture: {
        meeting:'',
        user:''
      },
      captureDetails: function(meeting, user){
        this.capture.meeting = angular.copy(meeting);
        this.capture.user = angular.copy(user);

      },
      getDetails: function(){
        var temp = this.capture;
        this.capture = {};
        return temp;
      }
    };
  });

  services.factory('timer', function(socket, $timeout){
      var factory_duration = moment.duration(3, 'minutes');
      
      var currentTimeout = {};
      var startTimeout = function(){
        if(factory_duration.asSeconds() === 0){
          socket.emit('timer:stop');
          return;
        }

        factory_duration.subtract(1, 'seconds');
        currentTimeout = $timeout(startTimeout, 1000);
      };
      
      var timer = {
        isEdit:false,
        expired: true,
        duration: factory_duration,
        init: function(duration){
             reset(duration);
        },
        start: function(clientDuration){
          socket.emit('timer:start',{duration:clientDuration});
        },
        stop: function(){
            socket.emit('timer:stop');
        },
        setMinutes: function(amount,meetingName){
            var newDuration = parseInt(amount);
            var modifiedDuration = moment.duration(newDuration,'minutes');
            reset(modifiedDuration);
            socket.emit("timer:modify",{"newDuration":newDuration,"meetingName":meetingName});
        }
      };

      var reset = function(newDuration){
        $timeout.cancel(currentTimeout);
        //Used to maintain the same duration reference, but reset it.
        factory_duration.subtract(factory_duration.asMilliseconds()).add(moment.duration(newDuration));
        timer.expired = true;
      };

      socket.on('timer:init', function(data){
          reset(data.duration);
      });

      socket.on('timer:start', function(data){
        reset(data.duration);
        timer.expired = false;
        startTimeout();
      });

      socket.on('timer:stop', function(data){
        reset(data.duration);
      });

      return timer;
  });

})(angular.module('services',[]));

function Meeting(name, startTime){
	this.name = name;
	this.startTime = new Date(startTime);
	this.available = false;
	this.durationMinutes = 15;
}
