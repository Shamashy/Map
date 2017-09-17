function viewModel() {
  var self = this; 
  var map, service, infowindow, address;
  var markers = []; 
  var myLocation = {}; 

  // paris city  set center of map
  var seattle = new google.maps.LatLng(48.856614, 2.3522219);  


  // get places
  self.placeArray = ko.observableArray([]);

  // hold information
  self.fourSquareAPI = '';
  
  // load the map
  function init() {
    map = new google.maps.Map(document.getElementById('map'), {
    center: seattle,
    zoom: 16,
    mapTypeId: google.maps.MapTypeId.ROADMAP    
    });
    // search for parks within radius 
    var request = {
      location: seattle,
      radius: 900,
      types: ['park']
    };

    //create infoWindow
    infowindow = new google.maps.InfoWindow();
    
    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, callback);         

    // show list of markers
    var list = (document.getElementById('list'));


    map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(list);
    
    var input = (document.getElementById('input'));
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(input);
    var searchBox = new google.maps.places.SearchBox((input));
    
    google.maps.event.addListener(searchBox, 'places_changed', function() {
      var places = searchBox.getPlaces();
      clearMarkers();
      self.placeArray.removeAll();
      var bounds = new google.maps.LatLngBounds();  

      for(var i = 0, place; i <= 10; i++){
        if (places[i] !== undefined){
          place = places[i];
          allLocations(place);
          setMarker(place);
          bounds.extend(place.geometry.location);          
        }
      } 
      map.fitBounds(bounds); 

    });
    google.maps.event.addListener(map, 'bounds_changed', function(){
      var bounds = map.getBounds();
      searchBox.setBounds(bounds);
    });  
    
  }
  
  // initialize of markers
  function setMarker(place) {
    var marker = new google.maps.Marker({
      map: map,
      name: place.name,
      position: place.geometry.location,
      place_id: place.place_id,
      animation: google.maps.Animation.DROP,
     
    });    

    if (place.vicinity !== undefined) {
      address = place.vicinity;
    } else if (place.formatted_address !== undefined) {
      address = place.formatted_address;
    }       
    var contentString = '<h2>' + place.name + '</h2><h4>' + address + '</h4>' + self.fourSquareAPI;

    google.maps.event.addListener(marker, 'click', function() {      
      infowindow.setContent(contentString);      
      infowindow.open(map, this);
      map.panTo(marker.position); 
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function(){marker.setAnimation(null);
    }, 1450);
    
    });

    markers.push(marker);
    return marker;
  }


  // handlle function that get results 
  function callback(results, status){
    if (status == google.maps.places.PlacesServiceStatus.OK){
      bounds = new google.maps.LatLngBounds();
      results.forEach(function (place){
        place.marker = setMarker(place);
        bounds.extend(new google.maps.LatLng(
          place.geometry.location.lat(),
          place.geometry.location.lng()));
      });
      map.fitBounds(bounds);
      results.forEach(allLocations);                 
    }
  }

  var client_id='TLN3IAXN4YZVDJYUMXNN1T4F4HPAHJB4SWNBHN4KOIYG1IKC';
var client_secret='P2XZSYELBGGYGNPC5DMFZIPLLWJXEPJC0IMGEU2FKDEPDU0I';
  this.getFoursquareInfo = function(point) {
    // url of foursqure
    var foursquare = 'https://api.foursquare.com/v2/venues/search?client_id='+client_id+'&client_secret='+client_secret+'&v=20150321&ll=48.856614,2.3522219&query=\'' + point['name'] + '\'&limit=10';
    
    // ajax part 
    $.getJSON(foursquare).done(function(response) {
        self.fourSquareAPI = '<br>' + 'information from Foursqure::' + '<br>';
        var venue = response.response.venues[0];             
        var venueName = venue.name;

        if (venueName !== null && venueName !== undefined) {
          self.fourSquareAPI += 'Name of Place: ' + venueName + '<br>';
        } else {
          self.fourSquareAPI += venue.name;
        }    
        
        var phoneNumber = venue.contact.formattedPhone;
          if (phoneNumber !== null && phoneNumber !== undefined) {
            self.fourSquareAPI += 'Mobile Number: ' + phoneNumber + ' ';
          } else {
            self.fourSquareAPI += 'Mobile number not available' + ' ';
          }

        var twitterHandle = venue.contact.twitter;
        if (twitterHandle !== null && twitterHandle !== undefined) {
          self.fourSquareAPI += '<br>' + 'twit: @' + twitterHandle;
          }
      }).fail(function(jqxhr, textStatus, error){
        var err = textStatus + ", " + error;
        console.log("Error:" + err);  
      });
  };  
 
  // show information on infoWindow
  self.clickMarker = function(place) {
    var marker;
    for(var i = 0; i < markers.length; i++) {      
      if(place.place_id === markers[i].place_id) { 
        marker = markers[i];
      }
    } 
    self.getFoursquareInfo(place);         
    map.panTo(marker.position);   

    // load foursquare function first
    setTimeout(function() {
      var contentString = '<h2>' + place.name + '</h2><h4>' + place.address + '</h4>' + self.fourSquareAPI;
      infowindow.setContent(contentString);
      infowindow.open(map, marker); 
      marker.setAnimation(google.maps.Animation.DROP); 
    }, 300);     
  };

  // allow knockout 
  function allLocations(place){
    var myLocation = {};    
    myLocation.place_id = place.place_id;
    myLocation.position = place.geometry.location.toString();
    myLocation.name = place.name;

    if (typeof(place.vicinity) !== undefined) {
      address = place.vicinity;
    } else if (typeof(place.formatted_address) !== undefined) {
      address = place.formatted_address;
    }
    myLocation.address = address;
    
    self.placeArray.push(myLocation);                
  }

  // remove markers when filter the list of locations 
  function clearMarkers() {
    for (var i = 0; i < markers.length; i++ ) {
      if (markers[i]) {
        markers[i].setMap(null);
      }
    }

    // set markers empty
    markers = []; 
  } 

  // resize map 
  google.maps.event.addDomListener(window, 'resize', function(){
    map.setCenter(seattle); 
  }); 

  // let the map is loaded 
  google.maps.event.addDomListener(window, 'load', init);
  

}

$(function(){
  ko.applyBindings(new viewModel());
});
