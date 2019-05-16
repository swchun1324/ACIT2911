var getPermission = () => {
    Notification.requestPermission().then(function(result) {
        return console.log(result);
      });      
}