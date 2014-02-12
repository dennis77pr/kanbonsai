'use strict';

/* Controllers */

function HomeCtrl($scope, socket) {
  $scope.messages = [];
  socket.on('send:message', function (message) {
    $scope.messages.push(message);
  });


  $scope.sendMessage = function () {
    socket.emit('send:message', {
      message: $scope.message
    });

    // add the message to our model locally
    $scope.messages.push({
      user: $scope.name,
      text: $scope.message
    });

    // clear message box
    $scope.message = '';
  };
  
  $scope.orderProp = '-available';
}

//PhoneListCtrl.$inject = ['$scope', '$http'];
function NavCtrl($scope, socket){
	// $scope.meetings = MeetingService.all;
}

//PhoneListCtrl.$inject = ['$scope', '$http'];
function SnapshotCtrl($scope, snapshot){
	var meeting = snapshot.get();
	console.log("Meeting:" + meeting);
	$scope.meetings = [meeting];
	$scope.meeting = meeting;
}


function CreateCtrl($scope){
	// $scope.meeting = new Meeting();

	// $scope.add = function(meeting){
	// 	MeetingService.add(meeting, MeetingService.all);
	// 	$scope.meeting = new Meeting();
	// };
}

function MeetingCtrl($scope, $routeParams, socket, snapshot, $location) {
	socket.connect($routeParams.meetingName);
	$scope.commentOrder = '-voters.length';
	$scope.userComment = new Comment();
	socket.on('init', function (data) 
	{
	    $scope.user = data.user;
	    $scope.meeting = data.meeting;
	});

	socket.on('user:join', function(data){
		$scope.meeting.participants.push(data.user);
	});

	socket.on('comment:post', function(data){
		$scope.meeting.comments.push(data.comment);
	});

	socket.on('user:left', function(data){
		var userToRemove = data.user;
		var allUsers = $scope.meeting.participants;
		for(var i = 0; i < allUsers.length; i++){
			if(allUsers[i] === userToRemove){
				allUsers.splice(i,1);
			}
		}

		var comments = $scope.meeting.comments;
		for(var i = 0; i < comments.length; i++){
			if(comments[i].author == userToRemove){
				comments.splice(i,1);
				continue;
			}

			var containingIndex = comments[i].voters.indexOf(userToRemove);
			if(containingIndex !== -1){
				comments[i].voters.splice(containingIndex,1);
			} 
		}
	});

	socket.on('comment:vote', function(data){
		var allComments = $scope.meeting.comments;
		for(var i = 0; i < allComments.length; i++){
			if(allComments[i].author === data.comment.author){
				allComments[i].voters.push(data.voter);
			}
		}
	});

	$scope.sendComment = function(){
		var commentToPost = $scope.userComment;
		commentToPost.author = $scope.user;
		commentToPost.voters = [];
		console.log("This is the author " + $scope.user);
		$scope.meeting.comments.push(commentToPost);
		socket.emit('comment:post',{
			comment: commentToPost
		});
		$scope.userComment = {};
	};

	$scope.vote = function(comment){
		var voter = $scope.user;
		comment.voters.push(voter);
		socket.emit('comment:vote', {
			comment: comment,
			voter: voter
		});
	};

	$scope.snapshot = function(){
		snapshot.grab($scope.meeting);
		$location.url('snapshot');
	};

	function Comment(author){
		this.status = '';
		this.voters = [];
		this.author = author;
		this.votes = function(){return this.voters.length};
	}
} 

//PhoneDetailCtrl.$inject = ['$scope', '$routeParams'];
